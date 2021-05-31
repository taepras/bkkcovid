import React, { useState, useEffect, useMemo, useRef } from "react";
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import * as d3 from 'd3';
import useDimensions from "react-cool-dimensions";
import styled from 'styled-components';

import ChartBars from './ChartBars';
import ChartLine from './ChartLine';
import { useSimplifiedSeries, useSmoothedSeries } from '../utils/useSmoothedSeries';
import { toThaiDate } from '../utils/toThaiDate';
import domtoimage from 'dom-to-image';
import Button from './Button';


const ChartContainer = styled.div`
  /* padding: 30px; */
  width: 100%;
  /* margin-top: 10px; */
  /* height: 50vh; */
  flex: 1;
  position: relative;
  transition: all 0.2s;

  text {
    font-family: 'Mitr', sans-serif;
  }

  .axis line, .axis path {
    stroke: white;
  }

  .axis text {
    fill: white;
    font-size: 12px;
    font-family: 'Mitr', sans-serif;
  }

  text {
    fill: #7F353E;
  }

  text.text-white {
    fill: #fff;
  }

  .y-axis-deaths {
    opacity: 0.3;

    path {
      opacity: 0;
    }
  }

  .y-axis {
    opacity: 0.4;

    path {
      opacity: 0;
    }
  }

  .shadow {
    filter: drop-shadow( 0px 8px 8px rgba(0, 0, 0, .2));
    /* Similar syntax to box-shadow */
  }

  .x-axis text { opacity: 0; }
  .x-axis-deaths text { opacity: 0; }
`;

const SvgContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  font-family: 'Mitr', sans-serif;

  
`;

const ChartBlock = ({
  processedData,
  datesRange,
  padding,
  breakPoint = 0.7,
  x,
  y,
  latestDate,
  firstDate,
  accumulated,
  latestValueOutskirt,
  latestValue,
  boxHeight,
  boxWidth,
  scaleX,
  scaleY,
  rawSeries,
  smoothedSeries,
  fill = '#333031',
  fillPanel = '#fff1',
  tickCount = 5,
  label = "",
  notes = ''
}) => {

  const gRef = useRef(null);
  const boxPadding = 16;
  const textBoxWidth = 200;

  useEffect(() => {
    if (!gRef.current)
      return;

    var g = d3.select(gRef.current)

    g.select("g.x-axis")
      // .attr("transform", `translate(0,${paddedHeight * (1 - breakPoint)})`)
      .attr("transform", `translate(0,${boxHeight - 2 * boxPadding - padding.bottom - padding.top})`)
      .call(d3.axisBottom(scaleX)
        .tickValues(scaleX.domain())
        .tickFormat(d => DateTime.fromJSDate(d).toISODate())
        .tickSize(0)
        .tickPadding(8)
      );

    g.select("g.y-axis")
      .call(d3.axisLeft(scaleY)
        .ticks(tickCount)
        .tickPadding(8)
        .tickSize(-(boxWidth - textBoxWidth - boxPadding * 2 - padding.left))
      );
  }, [gRef, scaleX, scaleY]);

  return (
    <g ref={gRef} transform={`translate(${x},${y})`}>
      <rect width={boxWidth} height={boxHeight} rx={16} fill={fill} class="shadow" />
      <g transform={`translate(${0},${0})`}>
        <rect width={textBoxWidth} height={boxHeight} rx={16} fill={fillPanel} />
        <g transform={`translate(${textBoxWidth / 2},${boxHeight / 2 - 6 - (notes ? 8 : 0)})`}>
          <text y={-44} dominantBaseline="middle" textAnchor="middle" fontWeight="400" fontSize={24} class="text-white">{label}</text>
          <text y={0} dominantBaseline="middle" textAnchor="middle" fontWeight="600" fontSize={48} class="text-white">
            +{latestValue?.toLocaleString?.()}
          </text>
          {((latestValueOutskirt ?? null) !== null) &&
            <text y={36} dominantBaseline="middle" textAnchor="middle" fontWeight="400" fontSize={20} class="text-white">
              ปริมณฑล +{latestValueOutskirt?.toLocaleString?.()}
            </text>
          }
          {notes &&
            <text y={60} dominantBaseline="middle" textAnchor="middle" fontWeight="300" fontSize={16} class="text-white" style={{ opacity: 0.5 }}>
              *{notes}
            </text>
          }
        </g>
        <text x={textBoxWidth / 2} y={boxHeight - boxPadding} dominantBaseline="baseline" textAnchor="middle" fontWeight="400" fontSize={20} class="text-white" style={{ opacity: 0.5 }}>
          สะสม {accumulated?.toLocaleString?.()} ราย
        </text>
      </g>
      {/* AXIS DATE TICKS */}

      <g
        class="chart"
        transform={`translate(${textBoxWidth},${0})`}
      >
        <g transform={`translate(${boxPadding + padding.left},${boxPadding + padding.top})`}>
          <g class="x-axis axis"></g>
          <g class="y-axis axis"></g>
          <ChartBars
            processedData={rawSeries}
            color="#fff6"
            scaleX={scaleX}
            scaleY={scaleY}
          />
          <ChartLine
            processedData={smoothedSeries}
            color="#fff"
            scaleX={scaleX}
            scaleY={scaleY}
          />
        </g>
        <text
          x={boxPadding + padding.left}
          y={boxHeight - boxPadding - padding.bottom + 6}
          dominantBaseline="hanging"
          textAnchor="start"
          fontWeight="400"
          fontSize={12}
          class="text-white">
          {toThaiDate(DateTime.fromISO(firstDate))}
        </text>
        <text
          x={boxWidth - textBoxWidth - boxPadding - padding.right}
          y={boxHeight - boxPadding - padding.bottom + 6}
          dominantBaseline="hanging"
          textAnchor="end"
          fontWeight="400"
          fontSize={12}
          class="text-white">
          {toThaiDate(DateTime.fromISO(latestDate))}
        </text>
        <text y={boxPadding} x={boxWidth - textBoxWidth - boxPadding} fontSize={12} dominantBaseline="hanging" textAnchor="end" class="text-white" style={{ opacity: 0.5 }}>
          ข้อมูลย้อนหลัง 2 เดือน
        </text>
      </g>
    </g>
  );
}

export default ChartBlock;
