import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import ukUA from 'antd/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import App from './App'
import './assets/main.css'

dayjs.locale('uk')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigProvider
    locale={ukUA}
    theme={{
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6
      }
    }}
  >
    <AntApp>
      <App />
    </AntApp>
  </ConfigProvider>
)
