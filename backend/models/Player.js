import mongoose from "mongoose";

const statsSchema = mongoose.Schema({
    season: String,
    depthChart: Number,
    games: Number,
    injuryCorrectionConstant: Number,
    rushing: {
        attempts: Number,
        attemptsMean: Number,
        yards: Number,
        yardsMean: Number,
        yardsPerAttempt: Number,
        long: Number,
        longMean: Number,
        twentyPlus: Number,
        twentyPlusMean: Number,
        td: Number,
        tdMean: Number,
    },
    receiving: {
        receptions: Number,
        receptionsMean: Number,
        targets: Number,
        targetsMean: Number,
        yards: Number,
        yardsMean: Number,
        yardsPerReception: Number,
        long: Number,
        longMean: Number,
        twentyPlus: Number,
        twentyPlusMean: Number,
        td: Number,
        tdMean: Number,
    },
    passing: {
        completions: Number,
        completionsMean: Number,
        attempts: Number,
        attemptsMean: Number,
        percentage: Number,
        yards: Number,
        yardsMean: Number,
        yardsPerAttempt: Number,
        td: Number,
        tdMean: Number,
        interceptions: Number,
        interceptionsMean: Number,
        sacks: Number,
        sacksMean: Number,
    },
    kicking: {
        fieldGoals: {
            sum: Number,
            mean: Number,
            percentage: Number,
            long: Number,
            longMean: Number,
            sum10_19: Number,
            mean10_19: Number,
            sum20_29: Number,
            mean20_29: Number,
            sum30_39: Number,
            mean30_39: Number,
            sum40_49: Number,
            mean40_49: Number,
            sum50Plus: Number,
            mean50Plus: Number,
        },
        extraPoints: {
            sum: Number,
            mean: Number,
            attempts: Number,
            attemptsMean: Number,
            percentage: Number,
        },
    },
    dst: {
        defense: {
            sacks: Number,
            sacksMean: Number,
            interceptions: Number,
            interceptionsMean: Number,
            fumblesRecovered: Number,
            fumblesRecoveredMean: Number,
            forcedFumbles: Number,
            forcedFumblesMean: Number,
            safeties: Number,
            safetiesMean: Number,
            td: Number,
            tdMean: Number,
        },
        specialTeams: {
            td: Number,
            tdMean: Number,
        },
    },
    misc: {
        touches: Number,
        touchesMean: Number,
        opportunities: Number,
        opportunitiesMean: Number,
        fumblesLost: Number,
        fumblesLostMean: Number,
        fumblesLostPerTouch: Number,
    },
    standard: {
        points: {
            sum: Number,
            mean: Number,
            median: Number,
            standardDeviation: Number,
            adjustedMean: Number,
        },
        games: {
            bad: Number,
            poor: Number,
            okay: Number,
            good: Number,
            great: Number,
        },
        qualityStartRatio: Number,
        goodStartRatio: Number,
        score: Number,
    },
    half: {
        points: {
            sum: Number,
            mean: Number,
            median: Number,
            standardDeviation: Number,
            adjustedMean: Number,
        },
        games: {
            bad: Number,
            poor: Number,
            okay: Number,
            good: Number,
            great: Number,
        },
        qualityStartRatio: Number,
        goodStartRatio: Number,
        score: Number,
    },
    ppr: {
        points: {
            sum: Number,
            mean: Number,
            median: Number,
            standardDeviation: Number,
            adjustedMean: Number,
        },
        games: {
            bad: Number,
            poor: Number,
            okay: Number,
            good: Number,
            great: Number,
        },
        qualityStartRatio: Number,
        goodStartRatio: Number,
        score: Number,
    },
});

const playerSchema = mongoose.Schema({
    name: String,
    team: String,
    position: String,
    yearsOfExperience: Number,
    stats: [statsSchema],
});

const Player = mongoose.model("Player", playerSchema);

export default Player;