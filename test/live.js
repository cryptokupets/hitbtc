require("mocha");
const chai = require("chai");
const { Exchange } = require("../lib/index");

const assert = chai.assert;

describe("liveCandles", () => {
  it("Возвращает стрим типа ICandle[]", function(done) {
    this.timeout(10000);

    const exchange = new Exchange();
    assert.isFunction(exchange.liveCandles);
    const options = {
      currency: "USD",
      asset: "BTC",
      period: 1
    };
    const rs = exchange.liveCandles(options);
    rs.on("data", candles => {
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
    });

    setTimeout(() => {
      rs.destroy();
    }, 1000);

    rs.on("close", () => done());
  });
});

describe("liveTicker", () => {
  it("ticker stream", function(done) {
    this.timeout(10000);

    const options = {
      currency: "USD",
      asset: "BTC"
    };
    const exchange = new Exchange();
    assert.isFunction(exchange.liveTicker);

    const rs = exchange.liveTicker(options);
    rs.on("data", ticker => {
      assert.isObject(ticker);
      assert.property(ticker, "ask");
      assert.property(ticker, "bid");
      assert.isNumber(ticker.ask);
      assert.isNumber(ticker.bid);
    });

    setTimeout(() => {
      rs.destroy();
    }, 500);

    rs.on("close", () => done());
  });
});
