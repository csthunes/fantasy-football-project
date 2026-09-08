import mongoose from "mongoose";

const rankInfoSchema = new mongoose.Schema(
    {
        playerId: {
            type: String,
            required: true,
        },
        rank: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        team: String,
        position: String,
        ecr: Number,
        isRookie: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const rankingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },

    pointsType: {
        type: String,
        required: true,
    },

    selection: {
        type: {
            type: String,
            required: true,
            enum: ["season", "profile", "weighted", "custom"],
        },
        seasons: {
            type: [Number],
            default: undefined,
        },
        profileId: {
            type: String,
            default: undefined,
        },
    },

    rankingStat: {
        type: String,
        required: true,
    },

    rankings: {
        overall: {
            type: [rankInfoSchema],
            default: [],
        },
        qb: {
            type: [rankInfoSchema],
            default: [],
        },
        rb: {
            type: [rankInfoSchema],
            default: [],
        },
        wr: {
            type: [rankInfoSchema],
            default: [],
        },
        te: {
            type: [rankInfoSchema],
            default: [],
        },
        k: {
            type: [rankInfoSchema],
            default: [],
        },
        dst: {
            type: [rankInfoSchema],
            default: [],
        },
    },

    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Ranking = mongoose.model("Ranking", rankingSchema);

export default Ranking;

