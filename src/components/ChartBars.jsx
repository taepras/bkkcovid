import React, { useState, useEffect, useMemo, useRef } from "react";
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import * as d3 from 'd3';
import useDimensions from "react-cool-dimensions";
import styled from 'styled-components';

const ChartBars = ({
  processedData = [],
  scaleX,
  scaleY,
  color,
  gutter = 2,
}) => {

  const gRef = useRef(null);

  const barWidth = useMemo(() => {
    return Math.max(
      Math.abs(scaleX.range()[1] - scaleX.range()[0]) / (processedData?.length || 1) - gutter,
      1)
  }, [gutter, processedData, scaleX, scaleY]);

  useEffect(() => {
    if (!gRef.current)
      return;

    var g = d3.select(gRef.current);

    var barGroup = g.selectAll("g.bar")
      .data(processedData)
      .enter()
      .append("g")
      .classed("bar", true);

    barGroup.selectAll("rect.b")
      .data(d => {
        console.log(d)
        return [d];
      })
      .enter()
      .append("rect")
      .classed("b", true)
      .attr("x", d => scaleX(new Date(d.date)))
      .attr("y", d => scaleY(d.value))
      .attr("width", barWidth)
      .attr("height", d => scaleY(scaleY.domain()[1] - d.value))
      .attr("fill", color);

  }, [processedData, scaleX, scaleY]);

  return <>
    <g class="bars" ref={gRef}></g>
  </>;
}

export default ChartBars;
