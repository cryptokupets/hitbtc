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
    const rs = exchange.liveCandles(options)
    rs.on("data", chunk: any => {
            console.log(chunk);
        });
        
        setTimeout(() => {
            rs.destroy();
        }, 1000);
        
        rs.on("close", () => done());
    });
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
    
        const rs = exchange.liveTicker(options)
    rs.on("data", chunk: any => {
            console.log(chunk);
        });
        
        setTimeout(() => {
            rs.destroy();
        }, 5000);
        
        rs.on("close", () => done());
    });

  });
});
