import React, { useState, useEffect, useMemo, useRef } from "react";
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import * as d3 from 'd3';
import useDimensions from "react-cool-dimensions";
import styled from 'styled-components';

import ChartBars from './ChartBars';
import ChartLine from './ChartLine';
import { useSimplifiedSeries, useSmoothedSeries } from '../utils/useSmoothedSeries';

const ChartContainer = styled.div`
  /* padding: 30px; */
  width: 100%;
  margin-top: 10px;
  /* height: 50vh; */
  flex: 1;
  position: relative;
  transition: all 0.2s;
`;

const SvgContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

const Chart = ({
  processedData,
  datesRange,
  padding = { top: 0, right: 0, bottom: 20, left: 40 },
  breakPoint = 0.7
}) => {

  const svgRef = useRef(null);
  const { observe, unobserve, width, height, entry } = useDimensions({
    onResize: ({ observe, unobserve, width, height, entry }) => {
      unobserve(); // To stop observing the current target element
      observe(); // To re-start observing the current target element
    },
  });

  const gap = 50;

  const smoothedNewCases = useSmoothedSeries(processedData, d => d?.bangkok?.new_cases ?? 0);
  // const smoothedNewCasesNational = useSmoothedSeries(processedData, d => d?.thailand?.NewConfirmed ?? 0);
  const bangkokNewCases = useSimplifiedSeries(processedData, d => d?.bangkok?.new_cases ?? 0);
  const nationalNewCases = useSimplifiedSeries(processedData, d => d?.thailand?.NewConfirmed ?? 0);
  const bangkokNewDeaths = useSimplifiedSeries(processedData, d => d?.bangkok?.new_death ?? 0);
  const smoothedNewDeaths = useSmoothedSeries(processedData, d => d?.bangkok?.new_death ?? 0);

  const paddedWidth = useMemo(() => width - padding.left - padding.right, [width, padding]);
  const paddedHeight = useMemo(() => height - padding.top - padding.bottom, [height, padding]);

  const scaleX = useMemo(() => d3.scaleTime()
    .domain(d3.extent(processedData, d => new Date(d.date)))
    .range([0, paddedWidth])
    , [processedData, paddedWidth]);

  const scaleY = useMemo(() => d3.scaleLinear()
    .domain([0, d3.max(processedData, d => +d?.thailand?.NewConfirmed ?? 0)])
    // .domain([0, d3.max(processedData, d => +d?.bangkok?.new_cases ?? 0)])
    .range([paddedHeight * breakPoint, 0])
    , [processedData, paddedHeight]);

  const scaleYDeaths = useMemo(() => d3.scaleLinear()
    .domain([0, d3.max(processedData, d => +d?.bangkok?.new_death ?? 0)])
    .range([paddedHeight * (1 - breakPoint) - gap, 0])
    , [processedData, paddedHeight]);

  useEffect(() => {
    if (!svgRef.current)
      return;

    var svg = d3.select(svgRef.current)

    svg.select("g.chart")
      .attr("transform",
        `translate(${padding.left},${padding.top})`);

    console.log(processedData);

    svg.select("g.x-axis")
      .attr("transform", `translate(0,${paddedHeight * breakPoint})`)
      .call(d3.axisBottom(scaleX)
        .tickValues(scaleX.domain())
        .tickFormat(d => DateTime.fromJSDate(d).toISODate())
      );

    svg.select("g.y-axis")
      .call(d3.axisLeft(scaleY));

    ////////////////////////////////////////////////////////////////////////////////////////

    svg.select("g.chart-death")
      .attr("transform",
        `translate(${padding.left},${padding.top + paddedHeight * breakPoint + gap})`);

    svg.select("g.x-axis-deaths")
      // .attr("transform", `translate(0,${paddedHeight * (1 - breakPoint)})`)
      .attr("transform", `translate(0,${paddedHeight * (1 - breakPoint) - gap})`)
      .call(d3.axisBottom(scaleX)
        .tickValues(scaleX.domain())
        .tickFormat(d => DateTime.fromJSDate(d).toISODate())
      );

    svg.select("g.y-axis-deaths")
      .call(d3.axisLeft(scaleYDeaths));

    // // Add the line
    // svg.append("path")
    //   .datum(processedData)
    //   .attr("fill", "none")
    //   .attr("stroke", "steelblue")
    //   .attr("stroke-width", 1.5)
    //   .attr("d", d3.line()
    //     .x(d => scaleX(new Date(d.date)))
    //     .y(d => scaleY(d?.bangkok?.new_cases ?? 0))
    //   )
  }, [processedData]);

  return <>
    <ChartContainer>
      <SvgContainer ref={observe}>
        <svg
          id="chart"
          className="d3-component"
          width={width}
          height={height}
          ref={svgRef}
        >
          <g class="chart">
            <ChartBars
              processedData={nationalNewCases}
              color="#fdd"
              scaleX={scaleX}
              scaleY={scaleY}
            />
            <ChartBars
              processedData={bangkokNewCases}
              color="#faa"
              scaleX={scaleX}
              scaleY={scaleY}
            />
            <ChartLine
              processedData={smoothedNewCases}
              color="#f00"
              scaleX={scaleX}
              scaleY={scaleY}
            />
            {/* <ChartLine
              processedData={smoothedNewCasesNational}
              color="#f00"
              scaleX={scaleX}
              scaleY={scaleY}
            /> */}
            <g class="x-axis"></g>
            <g class="y-axis"></g>
          </g>

          <g class="chart-death">
            <ChartBars
              processedData={bangkokNewDeaths}
              color="#bbb"
              scaleX={scaleX}
              scaleY={scaleYDeaths}
            />
            <ChartLine
              processedData={smoothedNewDeaths}
              color="#222"
              scaleX={scaleX}
              scaleY={scaleYDeaths}
            />
            <g class="x-axis-deaths"></g>
            <g class="y-axis-deaths"></g>
          </g>
        </svg>
      </SvgContainer>
    </ChartContainer>
  </>;
}

export default Chart;
