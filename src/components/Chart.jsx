import React, { useState, useEffect, useMemo, useRef } from "react";
import { DateTime } from 'luxon';
import Papa from 'papaparse';
import * as d3 from 'd3';
import useDimensions from "react-cool-dimensions";
import styled from 'styled-components';

import ChartBars from './ChartBars';
import ChartLine from './ChartLine';
import { useSimplifiedSeries, useSmoothedSeries } from '../utils/useSmoothedSeries';
import domtoimage from 'dom-to-image';


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

const Chart = ({
  processedData,
  datesRange,
  padding = { top: 0, right: 0, bottom: 12, left: 40 },
  breakPoint = 0.7
}) => {

  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const imageLinkRef = useRef(null);

  const width = 640;
  const height = 640;
  const pad = 32;
  const gutter = 24;
  const boxHeight = 240;
  const deathBoxHeight = 160;
  const boxWidth = width - pad * 2;
  const boxPadding = 16;
  const textBoxWidth = 160;
  const topOffset = 120;
  const chartPadding = padding;

  const { observe, unobserve, w, h, entry } = useDimensions({
    onResize: ({ observe, unobserve, width, height, entry }) => {
      unobserve(); // To stop observing the current target element
      observe(); // To re-start observing the current target element
    },
  });

  const gap = 50;

  const lastestDay = useMemo(() => {
    const weekDayString = [
      'อาทิตย์',
      'จันทร์',
      'อังคาร',
      'พุธ',
      'พฤหัส',
      'ศุกร์',
      'เสาร์',
      'อาทิตย์',
    ]

    const weekDayColor = [
      '#C33646',
      '#D5A21F',
      '#C55A9A',
      '#2B9649',
      '#D5682A',
      '#31A0C3',
      '#7E48A4',
      '#C33646',
    ]

    const monthString = [
      '',
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค. ',
    ]
    const lastEntry = processedData[processedData.length - 1];
    const dt = DateTime.fromISO(lastEntry?.date);
    const dayNum = dt.weekday;
    return {
      iso: lastEntry?.date,
      dateStr: `${dt.get('day')} ${monthString[dt.get('month')]} ${(dt.get('year') + 543) % 100}`,
      dayColor: weekDayColor[dayNum],
      weekdayStr: weekDayString[dayNum],
      weekdayNum: dayNum
    }
  }, [processedData]);

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
    .range([0, boxWidth - boxPadding * 2 - textBoxWidth - chartPadding.left - chartPadding.right])
    , [processedData, paddedWidth]);

  const scaleY = useMemo(() => d3.scaleLinear()
    // .domain([0, d3.max(processedData, d => +d?.thailand?.NewConfirmed ?? 0)])
    .domain([0, d3.max(processedData, d => +d?.bangkok?.new_cases ?? 0)])
    .range([boxHeight - 2 * boxPadding - chartPadding.top - chartPadding.bottom, 0])
    , [processedData, paddedHeight]);

  const scaleYDeaths = useMemo(() => d3.scaleLinear()
    .domain([0, d3.max(processedData, d => +d?.bangkok?.new_death ?? 0)])
    .range([deathBoxHeight - 2 * boxPadding - chartPadding.top - chartPadding.bottom, 0])
    , [processedData, paddedHeight]);

  useEffect(() => {
    if (!svgRef.current)
      return;

    var svg = d3.select(svgRef.current)

    svg.select("g.chart")
      .attr("transform",
        `translate(${pad + textBoxWidth + boxPadding + chartPadding.left},${topOffset + boxPadding + chartPadding.top})`);

    console.log(processedData);

    svg.select("g.x-axis")
      .attr("transform", `translate(0,${boxHeight - 2 * boxPadding - chartPadding.bottom})`)
      .call(d3.axisBottom(scaleX)
        .tickValues(scaleX.domain())
        .tickFormat(d => DateTime.fromJSDate(d).toISODate())
        .tickSize(0)
        .tickPadding(8)
      );

    svg.select("g.y-axis")
      .call(d3.axisLeft(scaleY)
        .ticks(7)
        .tickPadding(8)
        .tickSize(-(boxWidth - textBoxWidth - boxPadding * 2 - padding.left))
      );

    ////////////////////////////////////////////////////////////////////////////////////////

    svg.select("g.chart-death")
      .attr("transform",
        `translate(${pad + textBoxWidth + boxPadding + chartPadding.left},${boxPadding + topOffset + boxHeight + gutter + chartPadding.top})`);

    svg.select("g.x-axis-deaths")
      // .attr("transform", `translate(0,${paddedHeight * (1 - breakPoint)})`)
      .attr("transform", `translate(0,${deathBoxHeight - 2 * boxPadding - chartPadding.bottom})`)
      .call(d3.axisBottom(scaleX)
        .tickValues(scaleX.domain())
        .tickFormat(d => DateTime.fromJSDate(d).toISODate())
        .tickSize(0)
        .tickPadding(8)
      );

    svg.select("g.y-axis-deaths")
      .call(d3.axisLeft(scaleYDeaths)
        .ticks(5)
        .tickPadding(8)
        .tickSize(-(boxWidth - textBoxWidth - boxPadding * 2 - padding.left))
      );

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

  const downloadPng = () => {
    console.log(svgRef.current)
    const scale = 2;
    const elm = document.getElementById('container');
    console.log(elm.offsetHeight, elm.offsetWidth)
    domtoimage.toPng(elm, {
      height: elm.offsetHeight * scale,
      width: elm.offsetWidth * scale,
      style: {
        transform: `scale(${scale}) translate(${elm.offsetWidth / 2 / scale}px, ${elm.offsetHeight / 2 / scale}px)`
      },
    })
      .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = `bkkcovid-${lastestDay.iso}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error(err));

    // var svgString = new XMLSerializer().serializeToString(svgRef.current);

    // var canvas = canvasRef.current;
    // var ctx = canvas.getContext("2d");
    // var DOMURL = window.self.URL || window.self.webkitURL || window.self;
    // var img = new Image();
    // var svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    // var url = DOMURL.createObjectURL(svg);
    // img.onload = function () {
    //   ctx.drawImage(img, 0, 0);
    //   var png = canvas.toDataURL("image/png");
    //   let url = png.replace(/^data:image\/png/, 'data:application/octet-stream');
    //   imageLinkRef.current.setAttribute('href', url);
    //   imageLinkRef.current.click();

    //   // document.querySelector('#png-container').innerHTML = '<img src="' + png + '"/>';
    //   DOMURL.revokeObjectURL(png);
    // };
    // img.src = url;
  };

  return <>
    <ChartContainer>
      <SvgContainer ref={observe}>
        <div id="container" style={{ textAlign: 'left', display: 'inline-block' }}>
          <svg
            id="chart"
            className="d3-component"
            width={width}
            height={height}
            ref={svgRef}
            style={{
              backgroundColor: '#F3E1E3'
            }}
          >
            <text x={pad} y={pad} fontSize={24} dominantBaseline="hanging" fontFamily="Mitr" fontWeight="600">สถานการณ์ COVID-19 ใน</text>
            <text x={pad} y={pad + 20} fontSize={39} dominantBaseline="hanging" fontFamily="Mitr" fontWeight="600">กรุงเทพมหานคร</text>

            <rect x={width - pad - 160} y={pad} width={160} height={64} rx={16} fill={lastestDay.dayColor} />
            <text x={width - pad - 80} y={pad + 10} dominantBaseline="hanging" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">ประจำวัน{lastestDay.weekdayStr}ที่</text>
            <text x={width - pad - 80} y={pad + 28} dominantBaseline="hanging" textAnchor="middle" fontFamily="Mitr" fontWeight="600" fontSize={24} class="text-white">{lastestDay.dateStr}</text>

            <g transform={`translate(${pad},${topOffset})`}>
              <rect width={boxWidth} height={boxHeight} rx={16} fill="#C33646" class="shadow" />
              <rect width={textBoxWidth} height={boxHeight} rx={16} fill="#0002" />
              <g transform={`translate(${textBoxWidth / 2},${boxHeight / 2})`}>
                <text y={-36} dominantBaseline="middle" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">ผู้ติดเชื้อยืนยันวันนี้</text>
                <text y={0} dominantBaseline="middle" textAnchor="middle" fontFamily="Mitr" fontWeight="600" fontSize={48} class="text-white">
                  +{processedData?.[processedData.length - 1]?.bangkok?.new_cases?.toLocaleString?.()}
                </text>
              </g>
              <text x={textBoxWidth / 2} y={boxHeight - boxPadding} dominantBaseline="baseline" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">
                สะสม {processedData?.[processedData.length - 1]?.bangkok?.accumulated_cases?.toLocaleString?.()}
              </text>

              {/* AXIS DATE TICKS */}
              <text
                x={textBoxWidth + boxPadding + padding.left}
                y={boxHeight - boxPadding - padding.bottom + 6}
                dominantBaseline="hanging"
                textAnchor="start"
                fontFamily="Mitr"
                fontWeight="400"
                fontSize={12}
                class="text-white">
                {processedData?.[0]?.date}
              </text>
              <text
                x={boxWidth - boxPadding - padding.right}
                y={boxHeight - boxPadding - padding.bottom + 6}
                dominantBaseline="hanging"
                textAnchor="end"
                fontFamily="Mitr"
                fontWeight="400"
                fontSize={12}
                class="text-white">
                {processedData?.[processedData?.length - 1]?.date}
              </text>
            </g>
            <g class="chart">
              {/* <ChartBars
              processedData={nationalNewCases}
              color="#fdd"
              scaleX={scaleX}
              scaleY={scaleY}
            /> */}
              <g class="x-axis axis"></g>
              <g class="y-axis axis"></g>
              <ChartBars
                processedData={bangkokNewCases}
                color="#fff6"
                scaleX={scaleX}
                scaleY={scaleY}
              />
              <ChartLine
                processedData={smoothedNewCases}
                color="#fff"
                scaleX={scaleX}
                scaleY={scaleY}
              />
              {/* <ChartLine
              processedData={smoothedNewCasesNational}
              color="#f00"
              scaleX={scaleX}
              scaleY={scaleY}
            /> */}
            </g>

            <g transform={`translate(${pad},${topOffset + boxHeight + gutter})`}>
              <rect width={boxWidth} height={deathBoxHeight} rx={16} fill="#333031" class="shadow" />
              <rect width={textBoxWidth} height={deathBoxHeight} rx={16} fill="#fff1" />
              <g transform={`translate(${textBoxWidth / 2},${deathBoxHeight / 2 - 8})`}>
                <text y={-36} dominantBaseline="middle" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">ผู้เสียชีวิตยืนยันวันนี้</text>
                <text y={0} dominantBaseline="middle" textAnchor="middle" fontFamily="Mitr" fontWeight="600" fontSize={48} class="text-white">
                  +{processedData?.[processedData.length - 1]?.bangkok?.new_death?.toLocaleString?.()}
                </text>
                <text y={36} dominantBaseline="middle" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">
                  ปริมณฑล +{processedData?.[processedData.length - 1]?.bangkok?.new_death_outskirt?.toLocaleString?.()}
                </text>
              </g>
              <text x={textBoxWidth / 2} y={deathBoxHeight - boxPadding} dominantBaseline="baseline" textAnchor="middle" fontFamily="Mitr" fontWeight="400" fontSize={16} class="text-white">
                สะสม {processedData?.[processedData.length - 1]?.bangkok?.accumulated_death?.toLocaleString?.()}
              </text>
              {/* AXIS DATE TICKS */}
              <text
                x={textBoxWidth + boxPadding + padding.left}
                y={deathBoxHeight - boxPadding - padding.bottom + 6}
                dominantBaseline="hanging"
                textAnchor="start"
                fontFamily="Mitr"
                fontWeight="400"
                fontSize={12}
                class="text-white">
                {processedData?.[0]?.date}
              </text>
              <text
                x={boxWidth - boxPadding - padding.right}
                y={deathBoxHeight - boxPadding - padding.bottom + 6}
                dominantBaseline="hanging"
                textAnchor="end"
                fontFamily="Mitr"
                fontWeight="400"
                fontSize={12}
                class="text-white">
                {processedData?.[processedData?.length - 1]?.date}
              </text>
            </g>
            <g class="chart-death">
              <g class="x-axis-deaths axis"></g>
              <g class="y-axis-deaths axis"></g>
              <ChartBars
                processedData={bangkokNewDeaths}
                color="#fff6"
                scaleX={scaleX}
                scaleY={scaleYDeaths}
              />
              <ChartLine
                processedData={smoothedNewDeaths}
                color="#fff"
                scaleX={scaleX}
                scaleY={scaleYDeaths}
              />
            </g>

            <text x={pad} y={height - pad - 20} dominantBaseline="bottom" fontFamily="Mitr" fontWeight="400" fontSize={16} fill="#222">รวบรวมข้อมูลจาก ศบค. และ bangkok.go.th/covid19</text>
            <text x={pad} y={height - pad} dominantBaseline="bottom" fontFamily="Mitr" fontWeight="400" fontSize={16} fill="#222">ดูกราฟและไฟล์ข้อมูลได้ที่ taepras.com/bkkcovid19</text>

            {/* <text x={pad} y={height - pad - 20} dominantBaseline="bottom" fontFamily="Mitr" fontWeight="400" fontSize={16} fill="#222">รวบรวมข้อมูลจาก ศบค. และ bangkok.go.th/covid19</text>
          <text x={pad} y={height - pad} dominantBaseline="bottom" fontFamily="Mitr" fontWeight="400" fontSize={16} fill="#222">ดูกราฟและไฟล์ข้อมูลได้ที่ taepras.com/bkkcovid19</text> */}
          </svg>
        </div>
        <br />
        <br/>
        <button onClick={downloadPng}>Download PNG</button>
      </SvgContainer>
    </ChartContainer>
  </>;
}

export default Chart;
