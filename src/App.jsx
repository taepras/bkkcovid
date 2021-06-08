import React, { useEffect, useState, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from "./components/Chart";
import axios from 'axios';
import Papa from 'papaparse';
import { DateTime } from 'luxon';
import styled from 'styled-components';
import { toThaiDate } from './utils/toThaiDate';

const GraphicsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  /* padding: 30px; */
`

const Container = styled.div`
  width: 100%;
  max-width: 640px;
  margin: auto;
`

const api_url_daily_cases = "https://covid19.th-stat.com/api/open/timeline";
const gsheets_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR5KEVlTJbefwhG7GXg5swMW1rDSctbXuwZR-omHnxdet_DReCYnu0r_CVgzLTxwPqKlz4WMvKOppv1/pub?gid=0&single=true&output=csv";

const convDate = (x) => {
  return `${x.substr(6, 4)}-${x.substr(0, 2)}-${x.substr(3, 2)}`
}

function App() {
  const [nationalData, setNationalData] = useState({ Data: [] });
  const [bangkokData, setBangkokData] = useState();

  const [startDate, setStartDate] = useState(DateTime.now().minus({ months: 2 }).startOf('day'))
  const [endDate, setEndDate] = useState(DateTime.now().startOf('day'))

  const datesRange = useMemo(() => {
    const dates = [];
    let d = startDate;
    while (d <= endDate) {
      dates.push(d.toISODate())
      d = d.plus({ days: 1 });
    }
    return dates;
  }, [startDate, endDate]);


  useEffect(() => {
    // axios.get(api_url_daily_cases).then((res) => {
    //   console.log(res.data);
    //   setNationalData(res.data);
    // });

    axios.get(gsheets_url).then((res) => {
      const data = Papa.parse(res.data, {
        header: true,
        dynamicTyping: true
      });
      console.log('gsheets', data);
      const dt = DateTime.fromISO(data.data[data.data.length - 1].date);
      setEndDate(dt);
      setStartDate(dt.minus({ months: 2 }).startOf('day'));
      setBangkokData(data);
      // setData(res.data);
    });
  }, []);

  const processedData = useMemo(() => {
    if (!nationalData || !bangkokData)
      return [];

    const filteredNational = nationalData.Data
      // .filter(x => {
      //   const dt = DateTime.fromJSDate(new Date(x.Date));
      //   return (
      //     dt >= startDate.startOf('day') &&
      //     dt <= endDate.endOf('day')
      //   )
      // });

    // console.log('bkk', nationalData);
    // console.log('bkk', bangkokData);
    const filteredGSheets = bangkokData.data
      // .filter(x => {
      //   const dt = DateTime.fromISO(x.date);
      //   return (
      //     dt >= startDate.startOf('day') &&
      //     dt <= endDate.endOf('day')
      //   )
      // });
    // console.log('bkk', filteredGSheets);

    const combined = datesRange.map(date => {
      return {
        date: date,
        thailand: filteredNational?.filter(d => convDate(d.Date) === date)?.[0] ?? {},
        bangkok: filteredGSheets?.filter(d => d.date === date)?.[0] ?? {}
      }
    })

    console.log('gs', filteredGSheets, combined);

    return combined;
  }, [nationalData, bangkokData, startDate, endDate, datesRange]);

  const showTweetText = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('tweettext')
  });

  return (
    <div className="App">
      <Container>
        {/* <h1>สถานการณ์โควิดใน กทม.</h1> */}
        <Chart
          datesRange={datesRange}
          processedData={processedData} />
        {showTweetText &&
          <p style={{ padding: '16px', border: '1px #7F353E solid', borderRadius: '8px' }} id="tweet-text" onClick={() => {
            navigator.clipboard.writeText(
              document.getElementById("tweet-text").innerText);
          }}>
            ยอดโควิดกรุงเทพวันนี้ ({toThaiDate(processedData?.[processedData?.length - 1]?.date, true)})<br />
            <br />
          พบเชื้อ +{processedData?.[processedData?.length - 1]?.bangkok?.new_cases?.toLocaleString?.()} (ปริมณฑล +{processedData?.[processedData?.length - 1]?.bangkok?.new_cases_outskirt?.toLocaleString?.()})<br />
          เสียชีวิต +{processedData?.[processedData?.length - 1]?.bangkok?.new_death?.toLocaleString?.()} (ปริมณฑล +{processedData?.[processedData?.length - 1]?.bangkok?.new_death_outskirt?.toLocaleString?.()})<br />
            <br />
          #กราฟโควิด #โควิดกรุงเทพ<br />
          ติดตามสถานการณ์ได้ที่ https://taepras.com/bkkcovid<br />
          รวบรวมข้อมูลจาก ศบค. (@oc_ccsa) และ กทม. (@pr_bangkok)<br />
          </p>
        }
      </Container>
    </div>
  );
}

export default App;
