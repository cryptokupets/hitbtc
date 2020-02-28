import moment from "moment";
import * as request from "request-promise-native";
import { Readable } from "stream";
import WebSocket from "ws";

const BASE_URL = "https://api.hitbtc.com/api/2/";
const WS_ADDRESS = "wss://api.hitbtc.com/api/2/ws";

interface ICandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IMarketDataSource {
  getPairs(): Promise<Array<{ currency: string; asset: string }>>;
  getPeriods(): Promise<number[]>;
  getCandles(options: {
    currency: string;
    asset: string;
    period: number;
    start: string;
    end: string;
  }): Promise<ICandle[]>;
}

export interface ITicker {
  ask: number;
  bid: number;
}

export interface IExchange {
  getTicker(options: { currency: string; asset: string }): Promise<ITicker>;
}

function convertPeriod(period: number): string {
  let timeframe;
  switch ("" + period) {
    case "1":
      timeframe = "M1";
      break;

    case "3":
      timeframe = "M3";
      break;

    case "5":
      timeframe = "M5";
      break;

    case "15":
      timeframe = "M15";
      break;

    case "30":
      timeframe = "M30";
      break;

    case "60":
      timeframe = "H1";
      break;

    case "240":
      timeframe = "H4";
      break;
  }
  return timeframe;
}

export class Exchange implements IMarketDataSource, IExchange {
  public async getPairs(): Promise<Array<{ currency: string; asset: string }>> {
    const options = {
      baseUrl: BASE_URL,
      url: "public/symbol"
    };

    return (JSON.parse(await request.get(options)) as Array<{
      baseCurrency: string;
      quoteCurrency: string;
    }>).map(e => {
      return {
        currency: e.quoteCurrency,
        asset: e.baseCurrency
      };
    });
  }

  public async getPeriods(): Promise<number[]> {
    return [1, 3, 5, 15, 30, 60, 240];
  }

  public async getCandles({
    currency,
    asset,
    period,
    start,
    end
  }: {
    currency: string;
    asset: string;
    period: number;
    start: string;
    end: string;
  }): Promise<ICandle[]> {
    const CANDLES_LIMIT = 1000;
    const limit = Math.min(
      Math.floor(moment.utc(end).diff(moment.utc(start), "m") / period) + 1,
      CANDLES_LIMIT
    );

    const options = {
      baseUrl: BASE_URL,
      url: `public/candles/${asset.toUpperCase()}${currency.toUpperCase()}`,
      qs: {
        period: convertPeriod(period),
        from: moment.utc(start).toISOString(),
        limit
      }
    };

    return limit
      ? (JSON.parse(await request.get(options)) as Array<{
          timestamp: string;
          open: string;
          max: string;
          min: string;
          close: string;
          volume: string;
        }>).map(e => {
          return {
            time: e.timestamp,
            open: +e.open,
            high: +e.max,
            low: +e.min,
            close: +e.close,
            volume: +e.volume
          };
        })
      : [];
  }

  public async getTicker({
    currency,
    asset
  }: {
    currency: string;
    asset: string;
  }): Promise<ITicker> {
    const options = {
      baseUrl: BASE_URL,
      url: `public/ticker/${asset.toUpperCase()}${currency.toUpperCase()}`
    };

    const {
      ask,
      bid
    }: {
      ask: string;
      bid: string;
    } = JSON.parse(await request.get(options));

    return {
      ask: +ask,
      bid: +bid
    };
  }

  public liveCandles({
    currency,
    asset,
    period
  }: {
    currency: string;
    asset: string;
    period: number;
  }): Readable {
    const ws = new WebSocket(WS_ADDRESS);
    const rs = new Readable({
      objectMode: true,
      read: () => {},
      destroy: (err, callback) => {
        ws.on("close", () => {
          callback(err);
        });
        ws.close();
      }
    });

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          method: "subscribeCandles",
          params: {
            symbol: `${asset.toUpperCase()}${currency.toUpperCase()}`,
            period: convertPeriod(period),
            limit: 1000
          },
          id: 0
        })
      );
    });

    ws.on("message", (m: string) => {
      const data: {
        method: string;
        params: {
          data: Array<{
            timestamp: string;
            open: string;
            max: string;
            min: string;
            close: string;
            volume: string;
          }>;
        };
      } = JSON.parse(m);
      const params = data.params;
      if (
        (data.method === "snapshotCandles" ||
          data.method === "updateCandles") &&
        params &&
        params.data
      ) {
        rs.push(
          params.data.map(e => {
            return {
              time: e.timestamp,
              open: +e.open,
              high: +e.max,
              low: +e.min,
              close: +e.close,
              volume: +e.volume
            } as ICandle;
          })
        );
      }
    });
    return rs;
  }

  public liveTicker({
    currency,
    asset
  }: {
    currency: string;
    asset: string;
  }): Readable {
    const ws = new WebSocket(WS_ADDRESS);
    const rs = new Readable({
      objectMode: true,
      read: () => {},
      destroy: (err, callback) => {
        ws.on("close", () => {
          callback(err);
        });
        ws.close();
      }
    });

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          method: "subscribeTicker",
          params: { symbol: `${asset.toUpperCase()}${currency.toUpperCase()}` },
          id: 0
        })
      );
    });

    ws.on("message", (m: string) => {
      const data: {
        method: string;
        params: { ask: string; bid: string };
      } = JSON.parse(m);
      const params = data.params;
      if (data.method === "ticker" && params) {
        rs.push({
          ask: +params.ask,
          bid: +params.bid
        });
      }
    });

    return rs;
  }
}
