import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    Container,
    Card,
    CardHeader,
    CardContent,
    Collapse,
    ListItemText,
    IconButton,
    Box,
    Grid,
    FormControl,
    FormControlLabel,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Typography,
    Button,
    Switch,
    Divider,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

import { rankingFetchAll, rankingCreate } from "../../../../redux/ranking";
import { scoringRuleFetchAll } from "../../../../redux/scoringRule";
import { profileFetchAll } from "../../../../redux/profile";
import { playerFetchAll } from "../../../../redux/player";
import { setPointsType } from "../../../../redux/pointsType";
import { setYear } from "../../../../redux/year";


const PROFILE_FALLBACK_POSITIONS = ["K", "DST"];

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


const getNestedValue = (obj, path) => {
    return path.split(".").reduce((value, key) => value?.[key], obj);
};


const CreateForm = () => {
    const [expanded, setExpanded] = React.useState(false);
    const dispatch = useDispatch();
    const rankings = useSelector((state) => state.ranking.rankings);
    const playerAggregations = useSelector((state) => state.playerAggregation.playerAggregations);
    const players = useSelector((state) => state.player.players);
    const pointsType = useSelector((state) => state.pointsType.pointsType);
    const scoringRules = useSelector((state) => state.scoringRule.scoringRules);
    const profiles = useSelector((state) => state.profile.profiles);
    const [aggregationType, setAggregationType] = useState("season");
    const [profileId, setProfileId] = useState("");
    const year = useSelector((state) => state.year.year);
    const [rankingStat, setRankingStat] = useState("fantasy.fantasyPointsScore");
    const [includeFAs, setIncludeFAs] = useState(false);
    const [number, setNumber] = useState(300);

    useEffect(() => {
        dispatch(rankingFetchAll());
        dispatch(scoringRuleFetchAll());
        dispatch(profileFetchAll());
        dispatch(playerFetchAll());
    }, [dispatch]);

    const rankingStatistics = [
      {
            value: "fantasy.fantasyPointsScore",
            label: "Fantasy Score",
        },
        {
            value: "fantasy.fantasyPointsMean",
            label: "Mean Points",
        },
        {
            value: "fantasy.fantasyPointsMedian",
            label: "Median Points",
        },
        {
            value: "fantasy.fantasyPointsAdj",
            label: "Adjusted Points",
        },
    ];

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

    const getRankingAggregations = () => {
        return playerAggregations.filter((aggregation) => {
            if (aggregation.aggregationType !== aggregationType) {
                return false;
            }

            if (
                pointsType !== "ALL" &&
                aggregation.scoring?.configId !== pointsType
            ) {
                return false;
            }

            if (aggregation.selection?.seasons?.[0] !== Number(year)) {
                return false;
            }

            if (
                aggregationType === "profile" &&
                aggregation.selection?.profileId !== profileId
            ) {
                return false;
            }

            return true;
        });
    };

    const addRookiesToRanking = (ranked, players) => {
        const positions = ["QB", "RB", "WR", "TE", "K"];
        const result = [...ranked];

        for (const position of positions) {
            const existing = result.filter(
                (player) => player.position === position
            );

            const cutoff = existing.length;

            if (cutoff === 0) {
                continue;
            }

            const rookies = players
                .filter(
                    (player) =>
                        player.position === position &&
                        player.yearsOfExperience === 0 &&
                        player.ecr != null &&
                        player.ecr <= cutoff
                )
                .sort((a, b) => a.ecr - b.ecr);

            // Process worst ECR first so better rookies can be
            // inserted ahead of them without disturbing their slot.
            [...rookies]
                .sort((a, b) => b.ecr - a.ecr)
                .forEach((rookie) => {
                    if (
                        result.some(
                            (player) =>
                                player.playerId === rookie.playerId
                        )
                    ) {
                        return;
                    }

                    const positionPlayers = result.filter(
                        (player) => player.position === position
                    );

                    // ECR is 1-based; convert to zero-based index.
                    const targetRank = Math.round(rookie.ecr);
                    const insertIndex = Math.min(
                        targetRank - 1,
                        positionPlayers.length
                    );

                    const insertBefore =
                        positionPlayers[insertIndex];

                    const rookieEntry = {
                        playerId: rookie.playerId,
                        name: rookie.name,
                        team: rookie.team,
                        position: rookie.position,
                        value: null,
                        ecr: rookie.ecr,
                        isRookie: true,
                    };

                    if (!insertBefore) {
                        const lastPositionIndex = result.reduce(
                            (index, player, i) =>
                                player.position === position
                                    ? i
                                    : index,
                            -1
                        );

                        result.splice(
                            lastPositionIndex + 1,
                            0,
                            rookieEntry
                        );
                    } else {
                        const globalIndex =
                            result.indexOf(insertBefore);

                        result.splice(
                            globalIndex,
                            0,
                            rookieEntry
                        );
                    }
                });
        }

        return result;
    };
    
    function generateRanking() {
        let aggregations = getRankingAggregations();

        if (aggregationType === "profile") {
            const fallbackPositions = new Set(PROFILE_FALLBACK_POSITIONS);

            const fallbackAggregations = playerAggregations.filter(
                (aggregation) =>
                    aggregation.aggregationType === "season" &&
                    aggregation.selection?.seasons?.includes(Number(year)) &&
                    aggregation.scoring?.configId === pointsType &&
                    fallbackPositions.has(aggregation.position)
            );

            aggregations = [
                ...aggregations.filter(
                    (aggregation) =>
                        !fallbackPositions.has(aggregation.position)
                ),
                ...fallbackAggregations,
            ];
        }

        if (!includeFAs) {
            aggregations = aggregations.filter(
                (aggregation) => aggregation.team !== "FA"
            );
        }

        let ranked = aggregations
            .map((aggregation) => {
                let value = getNestedValue(
                    aggregation.stats,
                    rankingStat
                );

                if (value == null) {
                    return null;
                }

                if (aggregation.position === "QB") {
                    value *= 0.5;
                } else if (aggregation.position === "TE") {
                    value *= 1.15;
                } else if (aggregation.position === "K") {
                    value *= 0.8;
                } else if (aggregation.position === "DST") {
                    value *= 0.9;
                }

                return {
                    playerId: aggregation.playerId,
                    value,
                    name: aggregation.name,
                    team: aggregation.team,
                    position: aggregation.position,
                    isRookie: false,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.value - a.value)

        ranked = addRookiesToRanking(ranked, players);

        ranked = ranked
            .slice(0, number)
            .map((player, index) => ({
                ...player,
                rank: index + 1,
            }));

        dispatch(
            rankingCreate({
                name: `Rankings ${rankings.length + 1}`,
                pointsType,
                selection: {
                    type: aggregationType,
                    seasons:
                        aggregationType === "season"
                            ? [Number(year)]
                            : undefined,
                    profileId:
                        aggregationType === "profile"
                            ? profileId
                            : undefined,
                },
                rankingStat,
                rankings: {
                    overall: ranked,
                    qb: ranked.filter((p) => p.position === "QB"),
                    rb: ranked.filter((p) => p.position === "RB"),
                    wr: ranked.filter((p) => p.position === "WR"),
                    te: ranked.filter((p) => p.position === "TE"),
                    k: ranked.filter((p) => p.position === "K"),
                    dst: ranked.filter((p) => p.position === "DST"),
                },
            })
        );
    }

    return (
        <Container maxWidth="xl">
            <Card
                border={5}
                borderRadius={2}
                sx={{
                    mx: 5,
                    borderColor: "secondary.dark",
                }}
            >
                <CardHeader
                    title="Generate Rankings"
                    titleTypographyProps={{ fontSize: 18 }}
                    action={
                        <IconButton
                            onClick={() => setExpanded(!expanded)}
                            size="small"
                        >
                            {expanded ? (
                                <KeyboardArrowUp sx={{ color: "black" }} />
                            ) : (
                                <KeyboardArrowDown sx={{ color: "black" }} />
                            )}
                        </IconButton>
                    }
                    sx={{
                        py: 1,
                        backgroundColor: "secondary.light",
                    }}
                ></CardHeader>
                <Box sx={{ backgroundColor: "secondary.light" }}>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Divider sx={{ backgroundColor: "secondary.dark" }} />
                        <CardContent>
                            <Box
                                border={2}
                                borderRadius={2}
                                sx={{
                                    p: 1,
                                    px: 2,
                                    borderColor: "secondary.dark",
                                    backgroundColor: "white",
                                }}
                            >
                                <Grid
                                    container
                                    justify="space-between"
                                    alignItems="stretch"
                                    columnSpacing={2}
                                >
                                    <Grid item md={2}>
                                        <ListItemText secondary="Generate from descending order:" />
                                    </Grid>
                                    <Grid item md={10}>
                                        <FormControl
                                            size="small"
                                            sx={{ my: 1, mr: 1, minWidth: 80 }}
                                        >
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
                                                {availableYears.map((year) => (
                                                    <MenuItem key={year} value={String(year)}>
                                                        {year}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl
                                            size="small"
                                            sx={{ my: 1, mr: 1 }}
                                        >
                                            <InputLabel id="type-label" color="secondary">
                                                Scoring
                                            </InputLabel>
                                            <Select
                                                labelId="type-label"
                                                id="type-select"
                                                value={pointsType}
                                                label="Scoring"
                                                color="secondary"
                                                onChange={(event) => {
                                                    dispatch(
                                                        setPointsType(
                                                            event.target.value
                                                        )
                                                    );
                                                }}
                                            >
                                                {scoringRules.map((rule) => (
                                                    <MenuItem key={rule._id} value={rule._id}>
                                                        {rule.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl
                                            size="small"
                                            sx={{ my: 1, mr: 1 }}
                                        >
                                            <InputLabel id="ranking-stat-label" color="secondary">
                                                Ranking Statistic
                                            </InputLabel>
                                            <Select
                                                labelId="ranking-stat-label"
                                                id="ranking-stat-select"
                                                value={rankingStat}
                                                label="Ranking Statistic"
                                                color="secondary"
                                                onChange={(event) =>
                                                    setRankingStat(event.target.value)
                                                }
                                            >
                                                {rankingStatistics.map((stat) => (
                                                    <MenuItem key={stat.value} value={stat.value}>
                                                        {stat.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl 
                                            size="small"
                                            sx={{ my: 1, mr: 1 }}
                                        >
                                            <InputLabel id="agg-type-label" color="secondary">
                                                Aggregation Type
                                            </InputLabel>
                                            <Select
                                                labelId="agg-type-label"
                                                id="agg-type-select"
                                                value={aggregationType}
                                                label="Aggregation Type"
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
                                            <FormControl size="small" sx={{ my: 1, minWidth: 120 }}>
                                                <InputLabel id="profile-label" color="secondary">
                                                    Profile
                                                </InputLabel>
                                                <Select
                                                    labelId="profile-label"
                                                    id="profile-select"
                                                    label="Profile"
                                                    value={profileId}
                                                    onChange={(event) => setProfileId(event.target.value)}
                                                    color="secondary"
                                                >
                                                    {profiles.map((profile) => (
                                                        <MenuItem key={profile._id} value={profile._id}>
                                                            {profile.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                        <FormControl
                                            sx={{ my: 1, minWidth: 120 }}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        color="secondary"
                                                        checked={includeFAs}
                                                        onChange={() =>
                                                            setIncludeFAs(
                                                                !includeFAs
                                                            )
                                                        }
                                                    />
                                                }
                                                label="Include Free Agents"
                                                labelPlacement="start"
                                            />
                                        </FormControl>
                                        <Typography
                                            id="input-slider"
                                            fontSize={11.5}
                                            sx={{ ml: 2, color: "#656565" }}
                                        >
                                            Number of Players
                                        </Typography>
                                        <Slider
                                            aria-label="Number of Players"
                                            defaultValue={300}
                                            valueLabelDisplay="auto"
                                            step={25}
                                            marks
                                            min={200}
                                            max={400}
                                            sx={{ color: "secondary.dark" }}
                                            onChange={(event) =>
                                                setNumber(event.target.value)
                                            }
                                        />
                                        <Typography
                                            fontSize={11}
                                            sx={{
                                                mb: 1,
                                                mx: 0.5,
                                                color: "#656565",
                                            }}
                                        >
                                            Note: QBs will be assigned 1/2 value
                                            to appropriately place them.
                                        </Typography>
                                        <Button
                                            sx={{
                                                color: "white",
                                                backgroundColor:
                                                    "secondary.main",
                                                width: 180,
                                                ":hover": {
                                                    bgcolor: "secondary.dark",
                                                },
                                            }}
                                            onClick={generateRanking}
                                        >
                                            Generate Rankings
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box
                                border={2}
                                borderRadius={2}
                                sx={{
                                    mt: 2,
                                    p: 1,
                                    px: 2,
                                    borderColor: "secondary.dark",
                                    backgroundColor: "white",
                                }}
                            >
                                <Grid
                                    container
                                    justify="space-between"
                                    alignItems="stretch"
                                    columnSpacing={2}
                                >
                                    <Grid item md={2}>
                                        <ListItemText secondary="Create from existing ranking:" />
                                    </Grid>
                                    <Grid item md={10}>
                                        <Button
                                            sx={{
                                                mt: 0.5,
                                                mr: 1,
                                                color: "black",
                                                backgroundColor:
                                                    "secondary.light",
                                                width: 180,
                                                ":hover": {
                                                    color: "white",
                                                    bgcolor: "secondary.main",
                                                },
                                            }}
                                        >
                                            Rankings 1
                                        </Button>
                                        <Button
                                            sx={{
                                                color: "black",
                                                mt: 0.5,
                                                mr: 1,
                                                backgroundColor:
                                                    "secondary.light",
                                                width: 180,
                                                ":hover": {
                                                    color: "white",
                                                    bgcolor: "secondary.main",
                                                },
                                            }}
                                        >
                                            Rankings 2
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Collapse>
                </Box>
            </Card>
        </Container>
    );
};

export default CreateForm;
