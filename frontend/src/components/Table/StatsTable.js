import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { MaterialReactTable } from "material-react-table";
import {
    Box,
    InputLabel,
    MenuItem,
    FormControl,
    FormControlLabel,
    Select,
    Stack,
    Switch,
} from "@mui/material";

import { playerAggregationFetchAll } from "../../redux/playerAggregation";
import { scoringRuleFetchAll } from "../../redux/scoringRule";
import { profileFetchAll } from "../../redux/profile";
import { setYear } from "../../redux/year";
import { setPointsType } from "../../redux/pointsType";

import PlayerCard from "../PlayerCard/PlayerCard";


const getColumnId = (field, section) => {
    if (field.source === "root") {
        return field.key;
    }

    if (field.source === "selection") {
        return `selection.${field.key}`;
    }

    return `stats.${section}.${field.key}`;
};


// TODO: Return missing data value back to null instead of 0, 
// will require some changes to the table to handle null values correctly
const getValue = (row, field, section) => {
    switch (field.source) {
        case "root":
            return row?.[field.key] ?? 0;
        case "selection":
            return row?.selection?.[field.key] ?? 0;
        default:
            return row?.stats?.[section]?.[field.key] ?? 0;
    }
};


const makeColumn = (field, section) => ({
    accessorFn: (row) => getValue(row, field, section),
    id: getColumnId(field, section),
    header: field.header,
    size: field.size ?? 30,
    filterVariant: field.filterVariant ?? "range",
    filterSelectOptions: field.filterSelectOptions ?? undefined,
});


const makeFields = (definitions) =>
    definitions.map(([key, header, options = {}]) => ({
        key,
        header,
        ...options,
    }));


const statColumns = [
    // ============================================================
    // OVERVIEW
    // ============================================================

    {
        group: "OVERVIEW",
        section: "root",
        fields: [
            {
                key: "name",
                header: "NAME",
                source: "root",
                filterVariant: "text",
                size: 200,
                defaultVisible: true,
            },
            {
                key: "position",
                header: "POS",
                source: "root",
                filterVariant: "multi-select",
                filterSelectOptions: ["QB", "RB", "WR", "TE", "K", "DST"],
                defaultVisible: true,
            },
            {
                key: "team",
                header: "TEAM",
                source: "root",
                filterVariant: "multi-select",
                filterSelectOptions: [
                    "ARI", "ATL", "BAL", "BUF", "CAR", "CHI",
                    "CIN", "CLE", "DAL", "DEN", "DET", "GB",
                    "HOU", "IND", "JAX", "KC", "LAC", "LAR",
                    "LV", "MIA", "MIN", "NE", "NO", "NYG",
                    "NYJ", "PHI", "PIT", "SEA", "SF", "TB",
                    "TEN", "WAS", "FA",
                ],
                size: 50,
                defaultVisible: true,
            },
            {
                key: "posRank",
                header: "POS RANK",
                source: "root",
            },
            {
                key: "yearsOfExperience",
                header: "YOE",
                source: "root",
            },
            {
                key: "gameCount",
                header: "G",
                source: "root",
                defaultVisible: true,
            },
        ],
    },


    // ============================================================
    // PASSING
    // ============================================================

    {
        group: "PASSING TOTALS",
        section: "passing",
        fields: makeFields([
            ["completions", "CMP"],
            ["attempts", "ATT"],
            ["passingYards", "YDS"],
            ["passingTds", "TD"],
            ["passingInterceptions", "INT"],
            ["sacksSuffered", "SACK"],
            ["sackFumbles", "SACK FUM"],
            ["sackFumblesLost", "SACK FL"],
            ["passingAirYards", "AIR YDS"],
            ["passingYardsAfterCatch", "YAC"],
            ["passingFirstDowns", "FD"],
            ["passingEpa", "EPA"],
            ["passingCpoe", "CPOE"],
            ["passing2ptConversions", "2PT"],
            ["passing10", "10+"],
            ["passing16", "16+"],
            ["passing20", "20+"],
            ["passing40", "40+"],
        ]),
    },

    {
        group: "PASSING AVERAGES",
        section: "passing",
        fields: makeFields([
            ["completionsMean", "CMP"],
            ["attemptsMean", "ATT"],
            ["passingYardsMean", "YDS"],
            ["passingTdsMean", "TD"],
            ["passingInterceptionsMean", "INT"],
            ["sacksSufferedMean", "SACK"],
            ["sackFumblesMean", "SACK FUM"],
            ["sackFumblesLostMean", "SACK FL"],
            ["passingAirYardsMean", "AIR YDS"],
            ["passingYardsAfterCatchMean", "YAC"],
            ["passingFirstDownsMean", "FD"],
            ["passingEpaMean", "EPA"],
            ["passingCpoeMean", "CPOE"],
            ["passing2ptConversionsMean", "2PT"],
            ["passing10Mean", "10+"],
            ["passing16Mean", "16+"],
            ["passing20Mean", "20+"],
            ["passing40Mean", "40+"],
        ]),
    },

    {
        group: "PASSING ADVANCED",
        section: "passing",
        fields: makeFields([
            ["passingMaxAirDistance", "MAX AIR"],
            ["passingMaxCompletedAirDistance", "MAX CMP AIR"],
            ["passingPasserRating", "RTG"],
            ["passingAggressiveness", "AGG%"],
            ["passingAvgAirDistance", "AIR/ATT"],
            ["passingAvgAirYardsToSticks", "AIR STICKS"],
            ["passingAvgCompletedAirYards", "CMP AIR"],
            ["passingAvgTimeToThrow", "TTT"],
            ["passingCompletionPercentageAboveExpectation", "CPOE%"],
            ["passingExpectedCompletionPercentage", "xCMP%"],
            ["passingAvgIntendedAirYards", "INT AIR"],
            ["pacr", "PACR"],
            ["passingAvgAirYardsDifferential", "AIR DIFF"],
            ["passingCompletionPercentage", "CMP%"],
            ["passingYardsPerAtt", "Y/A"],
            ["passingCpoePerAtt", "CPOE/ATT"],
            ["passingEpaPerAtt", "EPA/ATT"],
        ]),
    },


    // ============================================================
    // RUSHING
    // ============================================================

    {
        group: "RUSHING TOTALS",
        section: "rushing",
        fields: makeFields([
            ["carries", "ATT"],
            ["rushingYards", "YDS"],
            ["rushingTds", "TD"],
            ["rushingFumbles", "FUM"],
            ["rushingFumblesLost", "FL"],
            ["rushingFirstDowns", "FD"],
            ["rushingEpa", "EPA"],
            ["rushing2ptConversions", "2PT"],
            ["rushing10", "10+"],
            ["rushing12", "12+"],
            ["rushing20", "20+"],
            ["rushing40", "40+"],
            ["rushingExpectedRushYards", "xYDS"],
            ["rushingRushYardsOverExpected", "RYOE"],
        ]),
    },

    {
        group: "RUSHING AVERAGES",
        section: "rushing",
        fields: makeFields([
            ["carriesMean", "ATT"],
            ["rushingYardsMean", "YDS"],
            ["rushingTdsMean", "TD"],
            ["rushingFumblesMean", "FUM"],
            ["rushingFumblesLostMean", "FL"],
            ["rushingFirstDownsMean", "FD"],
            ["rushingEpaMean", "EPA"],
            ["rushing2ptConversionsMean", "2PT"],
            ["rushing10Mean", "10+"],
            ["rushing12Mean", "12+"],
            ["rushing20Mean", "20+"],
            ["rushing40Mean", "40+"],
            ["rushingExpectedRushYardsMean", "xYDS"],
            ["rushingRushYardsOverExpectedMean", "RYOE"],
        ]),
    },

    {
        group: "RUSHING TEAM",
        section: "rushing",
        fields: makeFields([
            ["carriesTeam", "TEAM ATT"],
            ["carriesTeamMean", "TEAM ATT/G"],
            ["rushingYardsTeam", "TEAM YDS"],
            ["rushingYardsTeamMean", "TEAM YDS/G"],
            ["carriesShare", "ATT%"],
            ["rushingYardsShare", "YDS%"],
        ]),
    },

    {
        group: "RUSHING ADVANCED",
        section: "rushing",
        fields: makeFields([
            ["rushingAvgRushYards", "Y/A"],
            ["rushingAvgTimeToLos", "TLOS"],
            ["rushingEfficiency", "EFF"],
            ["rushingPercentAttemptsGteEightDefenders", "8+ DEF%"],
            ["rushingRushPctOverExpected", "RYOE%"],
            ["rushingRushYardsOverExpectedPerAtt", "RYOE/ATT"],
            ["rushingEpaPerAtt", "EPA/ATT"],
        ]),
    },


    // ============================================================
    // RECEIVING
    // ============================================================

    {
        group: "RECEIVING TOTALS",
        section: "receiving",
        fields: makeFields([
            ["receptions", "REC"],
            ["targets", "TGT"],
            ["receivingYards", "YDS"],
            ["receivingTds", "TD"],
            ["receivingFumbles", "FUM"],
            ["receivingFumblesLost", "FL"],
            ["receivingAirYards", "AIR YDS"],
            ["receivingYardsAfterCatch", "YAC"],
            ["receivingFirstDowns", "FD"],
            ["receivingEpa", "EPA"],
            ["receiving2ptConversions", "2PT"],
            ["receiving10", "10+"],
            ["receiving16", "16+"],
            ["receiving20", "20+"],
            ["receiving40", "40+"],
        ]),
    },

    {
        group: "RECEIVING AVERAGES",
        section: "receiving",
        fields: makeFields([
            ["receptionsMean", "REC"],
            ["targetsMean", "TGT"],
            ["receivingYardsMean", "YDS"],
            ["receivingTdsMean", "TD"],
            ["receivingFumblesMean", "FUM"],
            ["receivingFumblesLostMean", "FL"],
            ["receivingAirYardsMean", "AIR YDS"],
            ["receivingYardsAfterCatchMean", "YAC"],
            ["receivingFirstDownsMean", "FD"],
            ["receivingEpaMean", "EPA"],
            ["receiving2ptConversionsMean", "2PT"],
            ["receiving10Mean", "10+"],
            ["receiving16Mean", "16+"],
            ["receiving20Mean", "20+"],
            ["receiving40Mean", "40+"],
        ]),
    },

    {
        group: "RECEIVING TEAM",
        section: "receiving",
        fields: makeFields([
            ["targetsTeam", "TEAM TGT"],
            ["targetsTeamMean", "TEAM TGT/G"],
            ["receivingAirYardsTeam", "TEAM AIR"],
            ["receivingAirYardsTeamMean", "TEAM AIR/G"],
            ["receivingYardsTeam", "TEAM YDS"],
            ["receivingYardsTeamMean", "TEAM YDS/G"],
        ]),
    },

    {
        group: "RECEIVING ADVANCED",
        section: "receiving",
        fields: makeFields([
            ["receivingAvgCushion", "CUSH"],
            ["receivingAvgExpectedYac", "xYAC"],
            ["receivingAvgSeparation", "SEP"],
            ["receivingAvgYac", "YAC"],
            ["receivingAvgYacAboveExpectation", "YACOE"],
            ["receivingCatchPercentage", "CATCH%"],
            ["receivingPercentShareOfIntendedAirYards", "INT AIR%"],
            ["receivingAvgIntendedAirYards", "INT AIR"],
            ["racr", "RACR"],
            ["targetShare", "TGT%"],
            ["airYardsShare", "AIR%"],
            ["wopr", "WOPR"],
            ["receivingYardsPerReception", "Y/REC"],
            ["receivingEpaPerReception", "EPA/REC"],
            ["earnedTargetPct", "EARNED TGT%"],
            ["receivingYardsShare", "YDS%"],
        ]),
    },


    // ============================================================
    // KICKING
    // ============================================================

    {
        group: "KICKING",
        section: "kicking",
        fields: makeFields([
            ["fgAtt", "FG ATT"],
            ["fgBlocked", "FG BLK"],
            ["fgBlockedDistance", "FG BLK DIST"],
            ["fgLong", "LONG"],
            ["fgMade", "FG"],
            ["fgMade019", "FG 0-19"],
            ["fgMade2029", "FG 20-29"],
            ["fgMade3039", "FG 30-39"],
            ["fgMade4049", "FG 40-49"],
            ["fgMade5059", "FG 50-59"],
            ["fgMade60", "FG 60+"],
            ["fgMadeDistance", "FG DIST"],
            ["fgMissed", "FG MISS"],
            ["fgMissed019", "MISS 0-19"],
            ["fgMissed2029", "MISS 20-29"],
            ["fgMissed3039", "MISS 30-39"],
            ["fgMissed4049", "MISS 40-49"],
            ["fgMissed5059", "MISS 50-59"],
            ["fgMissed60", "MISS 60+"],
            ["fgMissedDistance", "MISS DIST"],
            ["patAtt", "PAT ATT"],
            ["patBlocked", "PAT BLK"],
            ["patMade", "PAT"],
            ["patMissed", "PAT MISS"],
        ]),
    },

    {
        group: "KICKING AVERAGES",
        section: "kicking",
        fields: makeFields([
            ["fgAttMean", "FG ATT"],
            ["fgBlockedMean", "FG BLK"],
            ["fgBlockedDistanceMean", "FG BLK DIST"],
            ["fgMadeMean", "FG"],
            ["fgMade019Mean", "FG 0-19"],
            ["fgMade2029Mean", "FG 20-29"],
            ["fgMade3039Mean", "FG 30-39"],
            ["fgMade4049Mean", "FG 40-49"],
            ["fgMade5059Mean", "FG 50-59"],
            ["fgMade60Mean", "FG 60+"],
            ["fgMadeDistanceMean", "FG DIST"],
            ["fgMissedMean", "FG MISS"],
            ["fgMissed019Mean", "MISS 0-19"],
            ["fgMissed2029Mean", "MISS 20-29"],
            ["fgMissed3039Mean", "MISS 30-39"],
            ["fgMissed4049Mean", "MISS 40-49"],
            ["fgMissed5059Mean", "MISS 50-59"],
            ["fgMissed60Mean", "MISS 60+"],
            ["fgMissedDistanceMean", "MISS DIST"],
            ["patAttMean", "PAT ATT"],
            ["patBlockedMean", "PAT BLK"],
            ["patMadeMean", "PAT"],
            ["patMissedMean", "PAT MISS"],
        ]),
    },

    {
        group: "KICKING ADVANCED",
        section: "kicking",
        fields: makeFields([
            ["fgPct", "FG%"],
            ["patPct", "PAT%"],
        ]),
    },


    // ============================================================
    // DEFENSE / SPECIAL TEAMS
    // ============================================================

    {
        group: "DEF/ST TOTALS",
        section: "defSt",
        fields: makeFields([
            ["specialTeamsTds", "ST TD"],
            ["defTacklesForLoss", "TFL"],
            ["defFumblesForced", "FF"],
            ["defSacks", "SACK"],
            ["defInterceptions", "INT"],
            ["defPassDefended", "PD"],
            ["defTds", "TD"],
            ["defFumbles", "FUM"],
            ["defSafeties", "SAFE"],
            ["defPuntBlocks", "PUNT BLK"],
            ["defPatBlocks", "PAT BLK"],
            ["defFgBlocks", "FG BLK"],
            ["def2ptMade", "2PT"],
            ["defThreeAndOuts", "3&O"],
            ["defFourthDownStops", "4D STOP"],
            ["defYardsAllowed", "YDS ALLOWED"],
            ["defPointsAllowed", "PTS ALLOWED"],
            ["fumbleRecoveryOpp", "FUM REC"],
            ["fumbleRecoveryTds", "FUM REC TD"],
            ["ptReturnTds", "PR TD"],
        ]),
    },

    {
        group: "DEF/ST AVERAGES",
        section: "defSt",
        fields: makeFields([
            ["specialTeamsTdsMean", "ST TD"],
            ["defTacklesForLossMean", "TFL"],
            ["defFumblesForcedMean", "FF"],
            ["defSacksMean", "SACK"],
            ["defInterceptionsMean", "INT"],
            ["defPassDefendedMean", "PD"],
            ["defTdsMean", "TD"],
            ["defFumblesMean", "FUM"],
            ["defSafetiesMean", "SAFE"],
            ["defPuntBlocksMean", "PUNT BLK"],
            ["defPatBlocksMean", "PAT BLK"],
            ["defFgBlocksMean", "FG BLK"],
            ["def2ptMadeMean", "2PT"],
            ["defThreeAndOutsMean", "3&O"],
            ["defFourthDownStopsMean", "4D STOP"],
            ["defYardsAllowedMean", "YDS ALLOWED"],
            ["defPointsAllowedMean", "PTS ALLOWED"],
            ["fumbleRecoveryOppMean", "FUM REC"],
            ["fumbleRecoveryTdsMean", "FUM REC TD"],
            ["ptReturnTdsMean", "PR TD"],
        ]),
    },


    // ============================================================
    // FANTASY
    // ============================================================

    {
        group: "FANTASY",
        section: "fantasy",
        fields: makeFields([
            ["fantasyPoints", "FPTS"],
            ["fantasyPointsMean", "FPTS/G", { defaultVisible: true }],
            ["fantasyPointsMedian", "MED"],
            ["fantasyPointsStd", "STD"],
            ["fantasyPointsGreat", "GREAT"],
            ["fantasyPointsGood", "GOOD"],
            ["fantasyPointsOkay", "OKAY"],
            ["fantasyPointsPoor", "POOR"],
            ["fantasyPointsBad", "BAD"],
            ["fantasyPointsPerOpportunity", "FPTS/OPP", { defaultVisible: true }],
            ["fantasyPointsPerSnap", "FPTS/SNAP", { defaultVisible: true }],
            ["fantasyPointsAdj", "ADJ FPTS", { defaultVisible: true }],
            ["fantasyPointsQSRat", "QS RAT", { defaultVisible: true }],
            ["fantasyPointsGSRat", "GS RAT", { defaultVisible: true }],
            ["fantasyPointsScore", "SCORE", { defaultVisible: true }],
        ]),
    },


    // ============================================================
    // MISC
    // ============================================================

    {
        group: "USAGE",
        section: "misc",
        fields: makeFields([
            ["opportunities", "OPP"],
            ["opportunitiesMean", "OPP/G", { defaultVisible: true }],
            ["offensePct", "SNP%", { defaultVisible: true }],
            ["offenseSnaps", "SNP"],
            ["offenseSnapsMean", "SNP/G"],
            ["defenseSnaps", "D SNP"],
            ["defenseSnapsMean", "D SNP/G"],
            ["stSnaps", "ST SNP"],
            ["stSnapsMean", "ST SNP/G"],
        ]),
    },
];


const columnVisibility = Object.fromEntries(
    statColumns
        .flatMap(group =>
            group.fields
                .filter(field => field.defaultVisible !== true)
                .map(field => [
                    getColumnId(field, group.section),
                    false,
                ])
        )
);


const formatAggregationType = (type) => {
    switch (type) {
        case "season":
            return "Season";
        case "profile":
            return "Profile";
        case "weighted":
            return "Weighted Average";
        default:
            return type;
    }
};


const StatsTable = () => {
    const playerAggregations = useSelector((state) => state.playerAggregation.playerAggregations);
    const year = useSelector((state) => state.year.year);
    const pointsType = useSelector((state) => state.pointsType.pointsType);
    const scoringRules = useSelector((state) => state.scoringRule.scoringRules);
    const profiles = useSelector((state) => state.profile.profiles);
    const [position, setPosition] = useState("ALL");
    const [aggregationType, setAggregationType] = useState("season");
    const [profileId, setProfileId] = useState("");
    const [team, setTeam] = useState("ALL");
    const [showFAs, setShowFAs] = useState(false);
    const dispatch = useDispatch();
    const [selectedRow, setSelectedRow] = useState(null); // null means modal is closed

    const handleRowClick = (row) => {
        setSelectedRow(row); // Opens modal with row data
    };

    const handleClose = () => {
        setSelectedRow(null); // Closes modal
    };

    useEffect(() => {
        dispatch(playerAggregationFetchAll());
        dispatch(scoringRuleFetchAll());
        dispatch(profileFetchAll());
    }, [dispatch]);

    useEffect(() => {
        if (!pointsType && scoringRules.length > 0) {
            dispatch(setPointsType(scoringRules[0]._id));
        }
    }, [scoringRules, pointsType, dispatch]);

    useEffect(() => {
        if (aggregationType === "profile" && !profileId && profiles.length > 0) {
            setProfileId(profiles[0]._id);
        } else if (aggregationType !== "profile") {
            setProfileId("");
        }
    }, [aggregationType, profiles, profileId]);

    //update table
    const tableData = useMemo(() => {
        return playerAggregations.filter((agg) => {
            // Only show table aggregations
            if (agg.scope !== "table") {
                return false;
            }

            // Selected season / aggregation
            const matchesAggregationType = aggregationType === "ALL" || agg.aggregationType === aggregationType;
            const matchesYear = year === "ALL" || agg.selection?.seasons?.includes(Number(year));
            // Scoring
            const matchesScoring = agg.scoring?.configId === pointsType;

            if (!matchesYear || !matchesAggregationType || !matchesScoring) {
                return false;
            }

            // Profile
            if (
                aggregationType === "profile" &&
                agg.selection?.profileId !== profileId
            ) {
                return false;
            }

            // Position
            if (position === "FLX") {
                if (!["RB", "WR", "TE"].includes(agg.position)) {
                    return false;
                }
            } else if (position !== "ALL" && agg.position !== position) {
                return false;
            }

            // Team
            if (team !== "ALL" && agg.team !== team) {
                return false;
            }

            // Free agents
            if (!showFAs && agg.team === "FA") {
                return false;
            }

            return true;
        });
    }, [
        playerAggregations,
        aggregationType,
        profileId,
        year,
        pointsType,
        position,
        team,
        showFAs,
    ]);

    const columns = useMemo(() => {
        return statColumns.map((group) => ({
            id: group.group,
            header: group.group,
            columns: group.fields.map((field) =>
                makeColumn(field, group.section)
            ),
        }));
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set();

        playerAggregations.forEach((agg) => {
            agg.selection?.seasons?.forEach((season) => {
                years.add(season);
            });
        });

        return [...years].sort((a, b) => b - a);
    }, [playerAggregations]);

    const availableAggregationTypes = useMemo(() => {
        return [
            ...new Set(
                playerAggregations
                    .map((agg) => agg.aggregationType)
                    .filter(Boolean)
            ),
        ];
    }, [playerAggregations]);

    const renderToolbar = ({ table }) => {
        return (
            <Stack direction="row" justifyContent="space-between">
                <FormControl sx={{ my: 1, mr: 1, minWidth: 80 }}>
                    <InputLabel id="pos-label" color="secondary">
                        Position
                    </InputLabel>
                    <Select
                        labelId="pos-label"
                        id="pos-select"
                        value={position}
                        label="Position"
                        size="small"
                        color="secondary"
                        onChange={(event) => {
                            table.setColumnFilters([]);
                            table.setGlobalFilter('');
                            setPosition(event.target.value);
                        }
                        }
                    >
                        <MenuItem value={"ALL"}>ALL</MenuItem>
                        <MenuItem value={"QB"}>QB</MenuItem>
                        <MenuItem value={"RB"}>RB</MenuItem>
                        <MenuItem value={"WR"}>WR</MenuItem>
                        <MenuItem value={"TE"}>TE</MenuItem>
                        <MenuItem value={"FLX"}>FLX</MenuItem>
                        <MenuItem value={"K"}>K</MenuItem>
                        <MenuItem value={"DST"}>DST</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ my: 1, minWidth: 120 }}>
                    <InputLabel id="team-label" color="secondary">
                        Team
                    </InputLabel>
                    <Select
                        labelId="team-label"
                        id="team-select"
                        value={team}
                        label="Team"
                        size="small"
                        color="secondary"
                        onChange={(event) =>
                            setTeam(event.target.value)
                        }
                    >
                        <MenuItem value={"ALL"}>All</MenuItem>
                        <MenuItem value={"ARI"}>Arizona</MenuItem>
                        <MenuItem value={"ATL"}>Atlanta</MenuItem>
                        <MenuItem value={"BAL"}>Baltimore</MenuItem>
                        <MenuItem value={"BUF"}>Buffalo</MenuItem>
                        <MenuItem value={"CAR"}>Carolina</MenuItem>
                        <MenuItem value={"CHI"}>Chicago</MenuItem>
                        <MenuItem value={"CIN"}>
                            Cincinnati
                        </MenuItem>
                        <MenuItem value={"CLE"}>Cleveland</MenuItem>
                        <MenuItem value={"DAL"}>Dallas</MenuItem>
                        <MenuItem value={"DEN"}>Denver</MenuItem>
                        <MenuItem value={"DET"}>Detroit</MenuItem>
                        <MenuItem value={"GB"}>Green Bay</MenuItem>
                        <MenuItem value={"HOU"}>Houston</MenuItem>
                        <MenuItem value={"IND"}>
                            Indianapolis
                        </MenuItem>
                        <MenuItem value={"JAX"}>
                            Jacksonville
                        </MenuItem>
                        <MenuItem value={"KC"}>
                            Kansas City
                        </MenuItem>
                        <MenuItem value={"LAC"}>
                            LA Chargers
                        </MenuItem>
                        <MenuItem value={"LAR"}>LA Rams</MenuItem>
                        <MenuItem value={"LV"}>Las Vegas</MenuItem>
                        <MenuItem value={"MIA"}>Miami</MenuItem>
                        <MenuItem value={"MIN"}>Minnesota</MenuItem>
                        <MenuItem value={"NE"}>
                            New England
                        </MenuItem>
                        <MenuItem value={"NO"}>
                            New Orleans
                        </MenuItem>
                        <MenuItem value={"NYG"}>NY Giants</MenuItem>
                        <MenuItem value={"NYJ"}>NY Jets</MenuItem>
                        <MenuItem value={"PHI"}>
                            Philadelphia
                        </MenuItem>
                        <MenuItem value={"PIT"}>
                            Pittsburgh
                        </MenuItem>
                        <MenuItem value={"SEA"}>Seattle</MenuItem>
                        <MenuItem value={"SF"}>
                            San Francisco
                        </MenuItem>
                        <MenuItem value={"TB"}>Tampa Bay</MenuItem>
                        <MenuItem value={"TEN"}>Tennessee</MenuItem>
                        <MenuItem value={"WAS"}>
                            Washington
                        </MenuItem>
                        <MenuItem value={"FA"}>
                            Free Agents
                        </MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ my: 1, mr: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                color="secondary"
                                checked={showFAs}
                                onChange={() =>
                                    setShowFAs(!showFAs)
                                }
                            />
                        }
                        label="FA"
                        labelPlacement="start"
                    />
                </FormControl>
                <FormControl sx={{ my: 1, mr: 1, minWidth: 120 }}>
                    <InputLabel id="year-label" color="secondary">
                        Year
                    </InputLabel>
                    <Select
                        labelId="year-label"
                        id="year-select"
                        value={year}
                        label="Year"
                        size="small"
                        color="secondary"
                        onChange={(event) =>
                            dispatch(setYear(event.target.value))
                        }
                    >
                        <MenuItem value="ALL">All years</MenuItem>
                        {availableYears.map((year) => (
                            <MenuItem key={year} value={String(year)}>
                                {year}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{ my: 1, mr: 1, minWidth: 80 }}>
                    <InputLabel id="type-label" color="secondary">
                        Scoring
                    </InputLabel>
                    <Select
                        labelId="type-label"
                        id="type-select"
                        value={pointsType}
                        label="Scoring"
                        size="small"
                        color="secondary"
                        onChange={(event) =>
                            dispatch(
                                setPointsType(event.target.value)
                            )
                        }
                    >
                        {scoringRules.map((rule) => (
                            <MenuItem key={rule._id} value={rule._id}>
                                {rule.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{ my: 1, mr: 1, minWidth: 120 }}>
                    <InputLabel id="agg-type-label" color="secondary">
                        Aggregation Type
                    </InputLabel>
                    <Select
                        labelId="agg-type-label"
                        id="agg-type-select"
                        value={aggregationType}
                        label="Aggregation Type"
                        size="small"
                        color="secondary"
                        onChange={(event) => {
                            setAggregationType(event.target.value);
                            setProfileId("");
                        }}
                    >
                        <MenuItem value="ALL">All analyses</MenuItem>
                        {availableAggregationTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {formatAggregationType(type)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {aggregationType === "profile" && (
                    <FormControl sx={{ my: 1, minWidth: 120 }}>
                        <InputLabel id="profile-label" color="secondary">
                            Profile
                        </InputLabel>
                        <Select
                            labelId="profile-label"
                            id="profile-select"
                            label="Profile"
                            size="small"
                            color="secondary"
                            value={profileId}
                            onChange={(event) => setProfileId(event.target.value)}
                        >
                            {profiles.map((profile) => (
                                <MenuItem key={profile._id} value={profile._id}>
                                    {profile.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Stack>
        );
    }

    return (
        <Box
            sx={{
                backgroundColor: "secondary.main",
                mx: 5,
            }}
        >
            {selectedRow && (
                <PlayerCard
                    isOpen={!!selectedRow}
                    onClose={handleClose}
                    player={selectedRow}
                />
            )}
            <MaterialReactTable
                columns={columns}
                data={tableData}
                enableRowNumbers
                rowNumberDisplayMode="static"
                columnFilterDisplayMode="popover"
                enableStickyHeader
                enableColumnActions={false}
                enableColumnPinning
                enableDensityToggle={false}
                initialState={{
                    columnPinning: {
                        left: ["mrt-row-numbers", "name", "position", "team"],
                    },
                    density: "compact",
                    pagination: { pageSize: 25 },
                    columnVisibility: { ...columnVisibility },
                    sorting: [
                        {
                            id: "stats.fantasy.fantasyPointsMean",
                            desc: true,
                        },
                    ],
                }}
                displayColumnDefOptions={{
                    "mrt-row-numbers": { size: 1 },
                }}
                muiTableProps={{
                    sx: {
                        border: "1px solid rgba(20, 20, 20, .3)",
                    },
                }}
                muiTableHeadCellProps={{
                    sx: {
                        border: "1px solid rgba(20, 20, 20, .3)",
                    },
                }}
                muiTableBodyRowProps={({ row }) => ({
                    onClick: () => {
                        handleRowClick(row.original);
                    },
                    sx: {
                        cursor: 'pointer', //you might want to change the cursor too when adding an onClick
                    },
                })}
                muiTableBodyCellProps={{
                    sx: {
                        border: "1px solid rgba(20, 20, 20, .1)",
                    },
                }}
                muiTableContainerProps={{ sx: { maxHeight: "80vh" } }}
                muiPaginationProps={{
                    rowsPerPageOptions: [25, 50, 100],
                }}
                renderTopToolbarCustomActions={renderToolbar}
            />
        </Box >
    );
};

export default StatsTable;
