import pandas as pd
from pymongo import ReplaceOne

from football_data.aggregate.aggregate import aggregate_player_games
from football_data.aggregate.context import calculate_context
from football_data.aggregate.defaults import (
    DEFAULT_SCORING_CONFIG,
    DEFAULT_WEIGHTED_WEIGHTS,
    ensure_reference_documents,
)
from football_data.aggregate.documents import (
    documents_from_aggregated,
    sanitize_document,
    weighted_documents,
)
from football_data.aggregate.selection import (
    persist_player_ids,
    resolve_scoring_config,
    resolve_selection,
)
from football_data.aggregate.weighted import (
    blend_season_aggregations,
    load_season_aggregation_docs,
    source_descriptors,
)

PLAYER_AGGREGATIONS = "player_aggregations"


def aggregate_players(db, selection, scoring_config, scope="table"):
    """
    Mongo orchestration layer for player-game aggregation.

    Selection describes how games are chosen, not the resulting DataFrame.
    `aggregate_player_games()` stays unaware of Mongo, profiles, and documents.

    Context contract (`same_selection`):
      Always resolve and aggregate the full matching population so positional
      ranks/percentiles/PAR are comparable. `scope="player"` still loads that
      population, then upserts only the requested playerId(s). For a custom
      game list, comparison players are aggregated over the intersection of
      their appearances with those same game IDs.
    """
    ensure_indexes(db)
    scoring_config = resolve_scoring_config(db, scoring_config)
    resolved = resolve_selection(db, selection)

    if not resolved.mapping:
        return []

    player_games_df = _documents_to_frame(
        db["player_games"].find(resolved.query)
    )
    team_games_df = _documents_to_frame(
        db["team_games"].find(resolved.query)
    )

    player_games_df = _filter_to_mapping(player_games_df, resolved.mapping)
    if resolved.game_ids and not team_games_df.empty:
        team_games_df = team_games_df[team_games_df["gameId"].isin(resolved.game_ids)]

    if player_games_df.empty or team_games_df.empty:
        return []

    aggregated = aggregate_player_games(player_games_df, team_games_df, scoring_config)
    if aggregated is None or aggregated.empty:
        return []

    aggregated = _keep_mapped_players(aggregated, resolved.mapping)
    aggregated = calculate_context(aggregated)

    aggregated = aggregated.round(2)

    players_by_id = _load_players(db, aggregated["playerId"].tolist())
    persist_ids = persist_player_ids(selection) if scope == "player" else None

    documents = documents_from_aggregated(
        aggregated,
        players_by_id=players_by_id,
        resolved=resolved,
        scoring_config=scoring_config,
        scope=scope,
        persist_ids=persist_ids,
    )
    _upsert_aggregations(db, documents)
    return documents


def build_season_aggregations(db, seasons, scoring_config=None, scope="table"):
    scoring_config = scoring_config or DEFAULT_SCORING_CONFIG
    ensure_reference_documents(db)

    written = []
    for season in seasons:
        written.extend(
            aggregate_players(
                db,
                {"type": "season", "seasons": [season]},
                scoring_config,
                scope=scope,
            )
        )
    return written


def build_weighted_aggregations(
    db,
    seasons,
    weights=DEFAULT_WEIGHTED_WEIGHTS,
    scoring_config=None,
    scope="table",
    selection_extras=None,
):
    """
    Blend existing season aggregation documents. Does not call
    aggregate_player_games().
    """
    if len(seasons) != len(weights):
        raise ValueError("seasons and weights must be the same length")

    ensure_indexes(db)
    ensure_reference_documents(db)
    scoring_config = resolve_scoring_config(db, scoring_config or DEFAULT_SCORING_CONFIG)

    season_docs = load_season_aggregation_docs(db, seasons, scoring_config)
    weighted_inputs = list(zip(weights, season_docs))
    if not any(docs for _, docs in weighted_inputs):
        return []

    blended = blend_season_aggregations(weighted_inputs)
    if blended is None or blended.empty:
        return []

    blended = blended.round(2)

    players_by_id = _load_players(db, blended["playerId"].tolist())
    selection = {
        "type": "weighted",
        "seasons": list(seasons),
        "weights": list(weights),
        **(selection_extras or {}),
    }
    persist_ids = persist_player_ids(selection) if scope == "player" else None
    documents = weighted_documents(
        blended,
        players_by_id=players_by_id,
        selection=selection,
        scoring_config=scoring_config,
        sources=source_descriptors(seasons, weights, scoring_config),
        scope=scope,
        persist_ids=persist_ids,
    )
    _upsert_aggregations(db, documents)
    return documents


def ensure_indexes(db):
    db[PLAYER_AGGREGATIONS].create_index(
        [("playerId", 1), ("aggregationId", 1)],
        unique=True,
    )


def _documents_to_frame(cursor):
    documents = []
    for document in cursor:
        document.pop("_id", None)
        documents.append(document)
    return pd.DataFrame(documents)


def _filter_to_mapping(player_games_df, mapping):
    if player_games_df.empty:
        return player_games_df

    pairs = pd.DataFrame(
        [
            {"playerId": player_id, "gameId": game_id}
            for player_id, game_ids in mapping.items()
            if not str(player_id).startswith("DST_")
            for game_id in game_ids
        ]
    )
    if pairs.empty:
        return player_games_df.iloc[0:0]

    return player_games_df.merge(pairs, on=["playerId", "gameId"], how="inner")


def _keep_mapped_players(aggregated, mapping):
    return aggregated[aggregated["playerId"].isin(mapping.keys())].copy()


def _load_players(db, player_ids):
    players = db["players"].find(
        {"playerId": {"$in": list(set(player_ids))}},
        {"_id": 0, "playerId": 1, "name": 1, "position": 1, "team": 1, "posRank": 1, "yearsOfExperience": 1},
    )
    return {player["playerId"]: player for player in players}


def _upsert_aggregations(db, documents):
    if not documents:
        return

    operations = [
        ReplaceOne(
            {
                "playerId": document["playerId"],
                "aggregationId": document["aggregationId"],
            },
            sanitize_document(document),
            upsert=True,
        )
        for document in documents
    ]
    db[PLAYER_AGGREGATIONS].bulk_write(operations, ordered=False)
