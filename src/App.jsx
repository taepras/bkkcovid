import React, { useEffect, useState, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from "./components/Chart";
import axios from 'axios';
import Papa from 'papaparse';
import { DateTime } from 'luxon';
import styled from 'styled-components';

const GraphicsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 30px;
`

const api_url_daily_cases = "https://covid19.th-stat.com/api/open/timeline";
const gsheets_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR5KEVlTJbefwhG7GXg5swMW1rDSctbXuwZR-omHnxdet_DReCYnu0r_CVgzLTxwPqKlz4WMvKOppv1/pub?gid=0&single=true&output=csv";

const convDate = (x) => {
  return `${x.substr(6, 4)}-${x.substr(0, 2)}-${x.substr(3, 2)}`
}

function App() {
  const [nationalData, setNationalData] = useState();
  const [bangkokData, setBangkokData] = useState();

  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 60 }).startOf('day'))
  const [endDate, setEndDate] = useState(DateTime.now().startOf('day'))

  const datesRange = useMemo(() => {
    const dates = [];
    let d = startDate;
    while (d <= endDate) {
      d = d.plus({ days: 1 });
      dates.push(d.toISODate())
    }
    return dates;
  }, [startDate, endDate]);


  useEffect(() => {
    axios.get(api_url_daily_cases).then((res) => {
      console.log(res.data);
      setNationalData(res.data);
    });

    axios.get(gsheets_url).then((res) => {
      const data = Papa.parse(res.data, {
        header: true,
        dynamicTyping: true
      });
      console.log('gsheets', data);
      setBangkokData(data);
      // setData(res.data);
    });
  }, []);

  const processedData = useMemo(() => {
    if (!nationalData || !bangkokData)
      return [];

    const filteredNational = nationalData.Data.filter(x => {
      const dt = DateTime.fromJSDate(new Date(x.Date));
      return (
        dt >= startDate.startOf('day') &&
        dt <= endDate.endOf('day')
      )
    });

    const filteredGSheets = bangkokData.data.filter(x => {
      const dt = DateTime.fromISO(x.date);
      return (
        dt >= startDate.startOf('day') &&
        dt <= endDate.endOf('day')
      )
    });

    const combined = datesRange.map(date => {
      return {
        date: date,
        thailand: filteredNational?.filter(d => {
          // console.log('zzzz', new Date(d.Date), date)
          return convDate(d.Date) === date
          // return true
          // // return DateTime.fromJSDate(new Date(d.Date)).toISODate() === date
        })?.[0] ?? {},
        bangkok: filteredGSheets?.filter(d => d.date === date)?.[0] ?? {}
      }
    })

    console.log('gs', filteredGSheets);

    return combined;
  }, [nationalData, bangkokData, startDate, endDate, datesRange]);

  return (
    <div className="App">
      <GraphicsContainer>
        <h1>สถานการณ์โควิดใน กทม.</h1>
        <Chart
          datesRange={datesRange}
          processedData={processedData} />
      </GraphicsContainer>
    </div>
  );
}

export default App;
