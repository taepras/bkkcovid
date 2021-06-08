import React, { useState, useEffect, useMemo, useRef } from "react";
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import * as d3 from 'd3';
import useDimensions from "react-cool-dimensions";
import styled from 'styled-components';

const ChartLine = ({
  processedData = [],
  scaleX,
  scaleY,
  gutter = 2,
  color = "#000",
  nMark = 7,
  markOffset = 24,
  ...props
}) => {

  const gRef = useRef(null);

  useEffect(() => {
    if (!gRef.current)
      return;

    var g = d3.select(gRef.current);

    console.log(processedData);

    g.select("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", d3.line()
        // .curve(d3.curveCatmullRom)
        .x(d => scaleX(new Date(d.date)))
        .y(d => scaleY(d.value))
      )

  }, [processedData]);


  const markPos = useMemo(() => {
    if (processedData.length <= 0) return { x: 0, y: 0 };

    console.log('markPos',
      processedData,
      scaleX(new Date(processedData?.[nMark]?.date)),
      scaleY(processedData?.[nMark]?.value))
    // const i = Math.min(processedData.length / 2);

    return {
      x: scaleX(new Date(processedData?.[nMark]?.date)),
      y: scaleY(processedData?.[nMark]?.value)
    }
  }, [processedData, nMark]);

  return <>
    <g class="line" ref={gRef} {...props}>
      <path stroke-linejoin="round" />
      <g class="average-mark" transform={`translate(${markPos.x},${markPos.y})`}>
        <line x1={0} y1={0} x2={0} y2={-markOffset} stroke="#fff" />
        <text textAnchor="middle" dominantBaseline="baseline" y={-markOffset-4} style={{ fill: '#fff' }} fontSize={12} fontWeight="400">ค่าเฉลี่ย 7 วัน</text>
      </g>
    </g>
  </>;
}

export default ChartLine;
