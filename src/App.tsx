import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { WebFetcher } from '../packages'

function App() {
  useEffect(() => {
    console.log('run');
    
    // const fetcher = new WebFetcher();
    // fetcher.load('https://mms.vod.susercontent.com/api/v4/11111000/mms/id-11111000-6ke14-m13zk5atx2k549.mp4').then(stream => {
      
    // })
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
     
    </>
  )
}

export default App
