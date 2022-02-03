const mongoose = require("mongoose")
const timestamp = Date.now() + 10800000

const userSchem = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userid: { type: Number, required: true, unique: true },
  acclvl: { type: Number, default: 0 },
  username: { type: String },
  lang: { type: String },
  bal: {
    type: Number,
    default: 0,
    get: (v) => Math.round(v * 100) / 100,
    set: (v) => Math.round(v * 100) / 100,
  },
  regDate: { type: Date, default: timestamp },
  num_pur: { type: Number, default: 0 },
  refer_id: { type: Number, default: 0 },
  refer: [
    {
      userid: { type: Number, default: 0 },
      gainrur: {
        type: Number,
        default: 0,
        get: (v) => Math.round(v * 100) / 100,
        set: (v) => Math.round(v * 100) / 100,
      },
    },
  ],
  wrapHist: [
    {
      orderid: { type: Number, default: 0 },
      date: { type: Date, default: 0 },
    },
  ],
})

const balHisSchem = new mongoose.Schema({
  id: { type: Number, required: true },
  bid: { type: Number, required: true, unique: true },
  bal: {
    type: Number,
    get: (v) => Math.round(v * 100) / 100,
    set: (v) => Math.round(v * 100) / 100,
  },
  balUp: { type: Number },
  balUpCond: { type: Number },
  status: { type: String },
  reqDate: { type: Date, default: timestamp },
  type: { type: String },
})

const priceSchem = new mongoose.Schema({
  id: { type: Number, required: true },
  vk_nakrutka: {
    type: Number,
    get: (v) => Math.round(v * 100) / 100,
    set: (v) => Math.round(v * 100) / 100,
  },
})

module.exports = { userSchem, balHisSchem }
