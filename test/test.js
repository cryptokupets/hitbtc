require("mocha");
const chai = require("chai");
const { Exchange } = require("../lib/index");

const assert = chai.assert;

describe("Exchange", () => {
  it("Является объектом", function() {
    const exchange = new Exchange();
    assert.isObject(exchange);
  });
});

describe("getPairs", () => {
  it("Если выполнить запрос getPairs, то вернется список поддерживаемых пар", function(done) {
    const exchange = new Exchange();
    assert.isFunction(exchange.getPairs);
    exchange.getPairs().then(pairs => {
      assert.isNotEmpty(pairs);

      const pair = pairs[0];
      assert.hasAllKeys(pair, ["currency", "asset"]);
      done();
    });
  });
});

describe("getPeriods", () => {
  it("Если выполнить запрос getPeriods, то вернется список чисел", function(done) {
    const exchange = new Exchange();
    assert.isObject(exchange);
    assert.isFunction(exchange.getPeriods);
    exchange.getPeriods().then(periods => {
      assert.isNotEmpty(periods);

      const period = periods[0];
      assert.isNumber(period);
      done();
    });
  });
});

describe("getCandles", () => {
  it("Если выполнить запрос getCandles, то вернется список типа ICandle", function(done) {
    const exchange = new Exchange();
    assert.isObject(exchange);
    assert.isFunction(exchange.getCandles);
    const options = {
      currency: "USD",
      asset: "BTC",
      period: 1,
      start: "2019-10-01",
      end: "2019-10-02"
    };
    exchange.getCandles(options).then(candles => {
      assert.isNotEmpty(candles);

      const candle = candles[0];
      assert.hasAllKeys(candle, [
        "time",
        "open",
        "high",
        "low",
        "close",
        "volume"
      ]);
      assert.isString(candle.time);
      assert.isNumber(candle.open);
      assert.isNumber(candle.high);
      assert.isNumber(candle.low);
      assert.isNumber(candle.close);
      assert.isNumber(candle.volume);
      done();
    });
  });
});

describe("getTicker", () => {
  it("getTicker", function(done) {
    const options = {
      currency: "USD",
      asset: "BTC"
    };
    const exchange = new Exchange();
    assert.isFunction(exchange.getTicker);
    exchange.getTicker(options).then(ticker => {
      assert.isObject(ticker);
      assert.property(ticker, "ask");
      assert.property(ticker, "bid");
      assert.isNumber(ticker.ask);
      assert.isNumber(ticker.bid);
      done();
    });
  });
});
