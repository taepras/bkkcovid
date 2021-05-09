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

  return <>
    <g class="line" ref={gRef} {...props}>
      <path />
    </g>
  </>;
}

export default ChartLine;
