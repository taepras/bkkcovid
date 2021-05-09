import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { DateTime } from 'luxon';
import Papa from 'papaparse';

const api_url = "https://covid19.th-stat.com/api/open/cases";

const api_url_daily_cases = "https://covid19.th-stat.com/api/open/timeline";
const gsheets_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR5KEVlTJbefwhG7GXg5swMW1rDSctbXuwZR-omHnxdet_DReCYnu0r_CVgzLTxwPqKlz4WMvKOppv1/pub?gid=0&single=true&output=csv";
// // 
// type Record = {
//   [key: string]: any;
// }

// type CovidDataResponse = {
//   Data?: Record[];
//   [key: string]: any;
// }




function CovidChart({
  datesRange,
  processedData
}) {
  const [filter, setFilter] = useState({
    ProvinceEn: 'Bangkok'
  });
  

  // const filteredData = useMemo(() => {
  //   if (!data || !gSheetsData)
  //     return [];

  //   let filtered = data.Data.filter((d, i) => {
  //     let filterKeys = Object.keys(filter)
  //     if (filterKeys.length === 0)
  //       return true

  //     // let date = DateTime.fromSQL(d.ConfirmDate)
  //     // if (date < startDate || date > endDate)
  //     //   return false

  //     for (let f in filterKeys) {
  //       if (d[filterKeys[f]] !== filter[filterKeys[f]])
  //         return false
  //     }
  //     return true
  //   })

  //   return filtered
  // }, [data, gSheetsData, filter, startDate, endDate])

  // const preprocessedData = useMemo(() => {
  //   let groupedData = groupBy(filteredData, 'ConfirmDate');
  //   let groupedDataArray = Object.keys(groupedData).map((k) => ({
  //     key: k,
  //     value: groupedData[k],
  //     casesCount: groupedData[k].length
  //   }));
  //   console.log(groupedDataArray);

  //   return groupedDataArray.reverse()
  // }, [filteredData])



  // const averagedData = useMemo(() => {
  //   let averageWindow = 7
  //   let averaged = preprocessedData.map((d, i) => {
  //     let minIdx = Math.max(0, i - averageWindow + 1);
  //     let maxIdx = i + 1;
  //     let caseCounts = preprocessedData.map(d => d.casesCount)
  //     let nDaysArr = caseCounts.slice(minIdx, maxIdx)
  //     return nDaysArr.reduce((a, b) => (a + b)) / nDaysArr.length
  //   })

  //   return averaged
  // }, [preprocessedData])



  const chartjsData = useMemo(() => {
    // console.log('processing chartJS data', preprocessedData.map(d => d.key))
    // if (!preprocessedData?.length)
    //   return [];

    return {
      labels: datesRange,
      datasets: [
        // {
        //   label: '# of Confirmed Cases',
        //   data: preprocessedData.map(d => d.casesCount),
        //   fill: false,
        //   backgroundColor: 'rgb(255, 99, 132, 0.3)',
        //   // borderColor: 'rgba(255, 99, 132)',
        //   type: 'bar'
        // },
        // {
        //   label: '# of Confirmed Cases (7-day average)',
        //   data: averagedData,
        //   fill: false,
        //   // backgroundColor: 'rgb(132, 99, 255)',
        //   borderColor: 'rgba(255, 99, 132)',
        // },
        
        {
          label: '# of Confirmed Cases',
          data: processedData.map(x => x.bangkok.new_cases),
          // fill: false,
          backgroundColor: 'rgb(255, 99, 132, 0.7)',
          type: 'bar'
        },
        {
          label: '# of Confirmed Cases (7-day average)',
          data: processedData.map(x => x.bangkok.new_cases_7day_average),
          fill: false,
          // backgroundColor: 'rgb(132, 99, 255)',
          borderColor: 'rgba(255, 99, 132)',
        },
        {
          label: '# of Confirmed Cases - National',
          data: processedData.map(x => x.thailand.NewConfirmed - x.bangkok.new_cases),
          // fill: false,
          backgroundColor: 'rgb(150, 150, 150, 0.3)',
          type: 'bar'
        },
        
        // {
        //   label: '# of Confirmed Cases (7-day average)',
        //   data: processedData.map(x => x.bangkok.new_cases_7day_average),
        //   fill: false,
        //   // backgroundColor: 'rgb(132, 99, 255)',
        //   borderColor: 'rgba(99, 255, 132)',
        // },
      ],
    };
  }, [processedData, datesRange])

  return <>
    <Line
      data={chartjsData}
      options={{
        responsive: true,
        maintainAspectRatio: false,

        scales: {
          xAxes: [{
            // type: 'timeseries',
            stacked: true,
            ticks: {
              maxTicksLimit: 1,
              maxRotation: 0,
              minRotation: 0
              // display: false
            }
          }],
          yAxes: [{
            stacked: true
          }]
        },
        elements: {
          point: {
            radius: 0
          }
        }
      }}
    />
    {/* <pre style={{textAlign: 'left'}}>{JSON.stringify(processedData, null, 2)}</pre> */}
  </>;
}

export default CovidChart;
