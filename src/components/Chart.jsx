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
import ChartBlock from "./ChartBlock";


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

const Chart = ({
  processedData,
  datesRange,
  padding = { top: 18, right: 0, bottom: 12, left: 40 },
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
  const textBoxWidth = 200;
  const topOffset = 120;
  const chartPadding = padding;

  const { observe, unobserve, w, h, entry } = useDimensions({
    onResize: ({ observe, unobserve, width, height, entry }) => {
      unobserve(); // To stop observing the current target element
      observe(); // To re-start observing the current target element
    },
  });

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

    const lastEntry = processedData[processedData.length - 1];
    const dt = DateTime.fromISO(lastEntry?.date);
    const dayNum = dt.weekday;
    return {
      iso: lastEntry?.date,
      dateStr: toThaiDate(dt),
      dayColor: weekDayColor[dayNum],
      weekdayStr: weekDayString[dayNum],
      weekdayNum: dayNum
    }
  }, [processedData]);

  // const smoothedNewCases = useSmoothedSeries(processedData, d => d?.bangkok?.new_cases ?? 0);
  // const smoothedNewCasesNational = useSmoothedSeries(processedData, d => d?.thailand?.NewConfirmed ?? 0);
  const bangkokNewCases = useSimplifiedSeries(processedData, d => d?.bangkok?.new_cases ?? 0);
  const smoothedNewCases = processedData.map(d => ({
    date: d.date,
    value: d?.bangkok?.new_cases_7day_average ?? 0
  }));
  const nationalNewCases = useSimplifiedSeries(processedData, d => d?.thailand?.NewConfirmed ?? 0);
  const bangkokNewDeaths = useSimplifiedSeries(processedData, d => d?.bangkok?.new_death ?? 0);
  // const smoothedNewDeaths = useSmoothedSeries(processedData, d => d?.bangkok?.new_death ?? 0);
  const smoothedNewDeaths = processedData.map(d => ({
    date: d.date,
    value: d?.bangkok?.new_deaths_7day_average ?? 0
  }));

  const paddedWidth = useMemo(() => width - padding.left - padding.right, [width, padding]);
  const paddedHeight = useMemo(() => height - padding.top - padding.bottom, [height, padding]);

  const scaleX = useMemo(() => d3.scaleTime()
    .domain(d3.extent(processedData, d => new Date(d.date)))
    .range([0, boxWidth - boxPadding * 2 - textBoxWidth - chartPadding.left - chartPadding.right])
    , [processedData, paddedWidth]);

  const scaleY = useMemo(() => d3.scaleLinear()
    // .domain([0, d3.max(processedData, d => +d?.thailand?.NewConfirmed ?? 0)])
    .domain([0, d3.max(processedData, d => +d?.bangkok?.new_cases ?? 0)])
    .range([
      boxHeight - 2 * boxPadding - chartPadding.top - chartPadding.bottom,
      0
    ])
    , [processedData, paddedHeight]);

  const scaleYDeaths = useMemo(() => d3.scaleLinear()
    .domain([0, d3.max(processedData, d => +d?.bangkok?.new_death ?? 0)])
    .range([
      deathBoxHeight - 2 * boxPadding - chartPadding.top - chartPadding.bottom,
      0
    ])
    , [processedData, paddedHeight]);

  const downloadPng = () => {
    console.log(svgRef.current)
    const scale = 3;
    const elm = document.getElementById('container');
    console.log(elm.offsetHeight, elm.offsetWidth)
    domtoimage.toPng(elm, {
      height: elm.offsetHeight * scale,
      width: elm.offsetWidth * scale,
      style: {
        transform: `scale(${scale}) translate(${elm.offsetWidth / scale}px, ${elm.offsetHeight / scale}px)`
      },
    })
      .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = `bkkcovid-${lastestDay.iso}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error(err));
  };

  return (
    <>
      <ChartContainer>
        {/* <SvgContainer ref={observe}> */}
        <div id="container">
          <svg
            id="chart"
            className="d3-component"
            width={'100%'}
            // height={height}
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{
              backgroundColor: '#F3E1E3'
            }}
          >
            <text x={pad} y={pad} fontSize={24} dominantBaseline="hanging" fontWeight="600">สถานการณ์ COVID-19 ใน</text>
            <text x={pad} y={pad + 20} fontSize={39} dominantBaseline="hanging" fontWeight="600">กรุงเทพมหานคร</text>

            <rect x={width - pad - 160} y={pad} width={160} height={64} rx={16} fill={lastestDay.dayColor} />
            <text x={width - pad - 80} y={pad + 10} dominantBaseline="hanging" textAnchor="middle" fontWeight="400" fontSize={16} class="text-white">ประจำวัน{lastestDay.weekdayStr}ที่</text>
            <text x={width - pad - 80} y={pad + 28} dominantBaseline="hanging" textAnchor="middle" fontWeight="600" fontSize={24} class="text-white">{lastestDay.dateStr}</text>

            <ChartBlock
              label="ผู้ติดเชื้อยืนยัน"
              svgRef={svgRef}
              x={pad}
              y={topOffset}
              boxHeight={boxHeight}
              boxWidth={boxWidth}
              padding={chartPadding}
              scaleY={scaleY}
              scaleX={scaleX}
              rawSeries={bangkokNewCases}
              smoothedSeries={smoothedNewCases}
              accumulated={processedData?.[processedData.length - 1]?.bangkok?.accumulated_cases}
              latestValueOutskirt={processedData?.[processedData.length - 1]?.bangkok?.new_cases_outskirt}
              latestValue={processedData?.[processedData.length - 1]?.bangkok?.new_cases}
              firstDate={processedData?.[0]?.date}
              latestDate={processedData?.[processedData?.length - 1]?.date}
              tickCount={8}
              fill="#C33646"
              fillPanel="#0002"
            // notes="ไม่รวมในเรือนจำ"
            />
            <ChartBlock
              label="ผู้เสียชีวิต"
              x={pad}
              y={topOffset + boxHeight + gutter}
              boxHeight={deathBoxHeight}
              boxWidth={boxWidth}
              padding={chartPadding}
              scaleY={scaleYDeaths}
              scaleX={scaleX}
              rawSeries={bangkokNewDeaths}
              smoothedSeries={smoothedNewDeaths}
              accumulated={processedData?.[processedData.length - 1]?.bangkok?.accumulated_death}
              latestValueOutskirt={processedData?.[processedData.length - 1]?.bangkok?.new_death_outskirt}
              latestValue={processedData?.[processedData.length - 1]?.bangkok?.new_death}
              firstDate={processedData?.[0]?.date}
              latestDate={processedData?.[processedData?.length - 1]?.date}
              fill="#333031"
              fillPanel="#fff1"
            />

            <text x={pad} y={height - pad - 20} dominantBaseline="bottom" fontWeight="400" fontSize={16} fill="#222">*ไม่รวมผู้ติดเชื้อในเรือนจำ / รวบรวมข้อมูลจาก ศบค. และ กทม. </text>
            <text x={pad} y={height - pad} dominantBaseline="bottom" fontWeight="400" fontSize={16} fill="#222">ติดตามสถานการณ์และและดูไฟล์ข้อมูลได้ที่ taepras.com/bkkcovid</text>

            <g transform={`translate(${width - pad},${height - pad})`}>
              <g transform={`translate(-54,-32)`}>
                {/* <image x="-54" y="-32" width="54" height="32" href="/bkkcovid/logo_initials.svg" /> */}
                <path d="M21.9537 20.21C23.8502 22.7782 26.2604 22.9758 27.4457 22.9758C29.9744 22.9758 31.9499 21.988 33.2538 20.7632C34.2416 19.8149 35.9406 17.7208 35.9406 13.8488C35.9406 10.4508 34.6367 8.31716 33.3724 7.05286C31.4363 5.1168 29.0262 4.7612 27.5247 4.7612C24.3638 4.7612 22.7044 6.46019 21.9537 7.52694V5.31435H17.1333V31.4706H21.9537V20.21ZM26.2209 9.02841C27.3667 9.02841 28.6311 9.463 29.5003 10.2532C30.4485 11.162 30.9622 12.5844 30.9622 13.8488C30.9622 15.1131 30.488 16.5355 29.4608 17.4838C28.8286 18.0764 27.8013 18.7086 26.2209 18.7086C24.7195 18.7086 23.6921 18.1159 23.06 17.5627C22.1117 16.733 21.4795 15.4292 21.4795 13.8488C21.4795 12.2683 22.0327 11.083 23.0995 10.1742C23.9687 9.38397 24.9565 9.02841 26.2209 9.02841Z" fill="#222222" />
                <path d="M14.5573 10.1777V5.35121H9.7309V0.524704H4.90437V5.35121H0.0778656V10.1777H4.90437V19.5089H9.7309V10.1777H14.5573Z" fill="#222222" />
                <path d="M14.5574 19.5089H9.7309V24.3354H14.5574V19.5089Z" fill="#222222" />
                <path d="M52.6494 28.5618V23.7323H34.733V28.5618H52.6494Z" fill="#14E1CA" />
              </g>
            </g> 
            
          </svg>
        </div>
        <div style={{ textAlign: 'center', margin: '32px', marginTop: '0px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div
              className="fb-share-button"
              data-href="https://taepras.github.io/bkkcovid/"
              data-layout="button"
              data-size="large"
              style={{ marginRight: '16px' }}
            >
              <a
                target="_blank"
                href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ftaepras.github.io%bkkcovid%2F&amp;src=sdkpreparse"
                className="fb-xfbml-parse-ignore"
                rel="noreferrer"
              >
                Share
              </a>
            </div>
            <a
              href="https://twitter.com/share?ref_src=twsrc%5Etfw"
              className="twitter-share-button"
              data-size="large"
              data-url="https://taepras.github.io/bkkcovid/"
              data-via="taepras"
              data-dnt="true"
              data-show-count="false"
            >
              Tweet
            </a>
            <div style={{ marginLeft: '16px', display: 'inline-block' }}>
              <div
                className="line-it-button"
                data-lang="en"
                data-type="share-a"
                data-ver="3"
                data-url="https://taepras.github.io/bkkcovid/"
                data-color="default"
                data-size="large"
                data-count="false"
              />
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <Button as="a" href="#" onClick={downloadPng} isFullWidth mb style={{ flexGrow: 1, flexBasis: 0, marginRight: '8px' }}>
              ดาวน์โหลดไฟล์ภาพ
            </Button>
            <Button as="a" href="https://docs.google.com/spreadsheets/d/1VY6ddD-DdmgIlX_RiFZnIa7ZFXB-mH8nD0hVxaROrP0/edit#gid=0" target="_blank" isFullWidth mb style={{ flexGrow: 1, flexBasis: 0, marginLeft: '16px' }}>
              ดูไฟล์ข้อมูล
            </Button>
          </div>
          {/* <pre style={{textAlign:'left'}}>
            {JSON.stringify(smoothedNewCases, null, 2)}
          </pre> */}
          <p style={{ lineHeight: 1.2 }}>
            ขอบคุณข้อมูลตัวเลขจาก <a href="https://www.facebook.com/informationcovid19" target="_blank">ศบค.</a> และ <a href="http://www.bangkok.go.th/covid19" target="_blank">กทม.</a>
            <br />รวบรวมข้อมูลและทำ visualization โดย
            <br /><a href="https://taepras.com" target="_blank">ธนวิชญ์ ประสงค์พงษ์ชัย (taepras.com)</a>
            <br />
            <br />
            <a href="https://taepras.medium.com/%E0%B8%9A%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B6%E0%B8%81%E0%B8%81%E0%B8%B2%E0%B8%A3-%E0%B9%80%E0%B8%A3%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%AD%E0%B8%87-%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%81%E0%B8%A3%E0%B8%B2%E0%B8%9F%E0%B9%82%E0%B8%84%E0%B8%A7%E0%B8%B4%E0%B8%94%E0%B9%83%E0%B8%99%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E-cbf7d41e2f94" target="_blank">
              อ่านที่มาของการทำกราฟนี้ (medium.com)
            </a>
            <br />
            <br />
            เว็บไซต์นี้เป็น open source หากสนใจนำไปใช้ต่อ<br/>สามารถเข้าไปได้ที่ <a href="https://github.com/taepras/bkkcovid" target="_blank">
              github.com/taepras/bkkcovid
            </a>
          </p>
        </div>
        {/* </SvgContainer> */}
      </ChartContainer>
    </>
  );
}

export default Chart;
