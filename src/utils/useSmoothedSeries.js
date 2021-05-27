import React, { useMemo } from "react";

export const useSimplifiedSeries = (data, yFunction) => {
    return useMemo(() => {
      return data.map((x, i) => {
        return {
          date: x.date,
          value: yFunction(x)
        }
      });
    }, [data, yFunction]);
  };

export const useSmoothedSeries = (data, yFunction, n = 7) => {
  return useMemo(() => {
    return data.map((x, i) => {
      return (x && (typeof yFunction(x) === 'number'))
      ? {
        date: x.date,
        value: data
          .map(yFunction)
          .filter((d, j) => i - n <= j && j <= i)
          .reduce((a, b) => a + b, 0) / (Math.min(n, i) || 1),
      }
      : undefined;
    }).filter(x => x !== undefined);
  }, [data, yFunction, n]);
};
