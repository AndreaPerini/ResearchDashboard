import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import svgMap from 'svgmap';
import 'svgmap/dist/svgMap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chart from 'chart.js/auto';
import { DataSet, Network } from 'vis';
import CookiePopup from './CookiePopup';

// Server URL
const API_BASE_URL = 'http://localhost:3001';

// GUI version
const gui_version = '5.0';

// Nations and continents with colors and names
const nations = {
  AD: { name: "Andorra", continent: "EU" },
  AE: { name: "United Arab Emirates", continent: "AS" },
  AF: { name: "Afghanistan", continent: "AS" },
  AG: { name: "Antigua and Barbuda", continent: "NA" },
  AL: { name: "Albania", continent: "EU" },
  AM: { name: "Armenia", continent: "AS" },
  AO: { name: "Angola", continent: "AF" },
  AR: { name: "Argentina", continent: "SA" },
  AS: { name: "American Samoa", continent: "OC" },
  AT: { name: "Austria", continent: "EU" },
  AU: { name: "Australia", continent: "OC" },
  AW: { name: "Aruba", continent: "NA" },
  AZ: { name: "Azerbaijan", continent: "AS" },
  BA: { name: "Bosnia and Herzegovina", continent: "EU" },
  BB: { name: "Barbados", continent: "NA" },
  BD: { name: "Bangladesh", continent: "AS" },
  BE: { name: "Belgium", continent: "EU" },
  BF: { name: "Burkina Faso", continent: "AF" },
  BG: { name: "Bulgaria", continent: "EU" },
  BH: { name: "Bahrain", continent: "AS" },
  BI: { name: "Burundi", continent: "AF" },
  BJ: { name: "Benin", continent: "AF" },
  BM: { name: "Bermuda", continent: "NA" },
  BN: { name: "Brunei", continent: "AS" },
  BO: { name: "Bolivia", continent: "SA" },
  BR: { name: "Brazil", continent: "SA" },
  BS: { name: "Bahamas", continent: "NA" },
  BT: { name: "Bhutan", continent: "AS" },
  BW: { name: "Botswana", continent: "AF" },
  BY: { name: "Belarus", continent: "EU" },
  BZ: { name: "Belize", continent: "NA" },
  CA: { name: "Canada", continent: "NA" },
  CD: { name: "Congo (Congo-Brazzaville)", continent: "AF" },
  CF: { name: "Central African Republic", continent: "AF" },
  CG: { name: "Congo", continent: "AF" },
  CH: { name: "Switzerland", continent: "EU" },
  CI: { name: "Côte d'Ivoire", continent: "AF" },
  CL: { name: "Chile", continent: "SA" },
  CM: { name: "Cameroon", continent: "AF" },
  CN: { name: "China", continent: "AS" },
  CO: { name: "Colombia", continent: "SA" },
  CR: { name: "Costa Rica", continent: "NA" },
  CU: { name: "Cuba", continent: "NA" },
  CV: { name: "Cabo Verde", continent: "AF" },
  CW: { name: "Curaçao", continent: "NA" },
  CY: { name: "Cyprus", continent: "EU" },
  CZ: { name: "Czechia", continent: "EU" },
  DE: { name: "Germany", continent: "EU" },
  DK: { name: "Denmark", continent: "EU" },
  DO: { name: "Dominican Republic", continent: "NA" },
  DZ: { name: "Algeria", continent: "AF" },
  EC: { name: "Ecuador", continent: "SA" },
  EE: { name: "Estonia", continent: "EU" },
  EG: { name: "Egypt", continent: "AF" },
  ER: { name: "Eritrea", continent: "AF" },
  ES: { name: "Spain", continent: "EU" },
  ET: { name: "Ethiopia", continent: "AF" },
  FI: { name: "Finland", continent: "EU" },
  FJ: { name: "Fiji", continent: "OC" },
  FM: { name: "Micronesia", continent: "OC" },
  FO: { name: "Faroe Islands", continent: "EU" },
  FR: { name: "France", continent: "EU" },
  GA: { name: "Gabon", continent: "AF" },
  GB: { name: "United Kingdom", continent: "EU" },
  GD: { name: "Grenada", continent: "NA" },
  GE: { name: "Georgia", continent: "AS" },
  GF: { name: "French Guiana", continent: "SA" },
  GH: { name: "Ghana", continent: "AF" },
  GI: { name: "Gibraltar", continent: "EU" },
  GL: { name: "Greenland", continent: "NA" },
  GM: { name: "Gambia", continent: "AF" },
  GN: { name: "Guinea", continent: "AF" },
  GP: { name: "Guadeloupe", continent: "NA" },
  GQ: { name: "Equatorial Guinea", continent: "AF" },
  GR: { name: "Greece", continent: "EU" },
  GT: { name: "Guatemala", continent: "NA" },
  GU: { name: "Guam", continent: "OC" },
  GW: { name: "Guinea-Bissau", continent: "AF" },
  GY: { name: "Guyana", continent: "SA" },
  HK: { name: "Hong Kong", continent: "AS" },
  HN: { name: "Honduras", continent: "NA" },
  HR: { name: "Croatia", continent: "EU" },
  HT: { name: "Haiti", continent: "NA" },
  HU: { name: "Hungary", continent: "EU" },
  ID: { name: "Indonesia", continent: "AS" },
  IE: { name: "Ireland", continent: "EU" },
  IL: { name: "Israel", continent: "AS" },
  IN: { name: "India", continent: "AS" },
  IQ: { name: "Iraq", continent: "AS" },
  IR: { name: "Iran", continent: "AS" },
  IS: { name: "Iceland", continent: "EU" },
  IT: { name: "Italy", continent: "EU" },
  JE: { name: "Jersey", continent: "EU" },
  JM: { name: "Jamaica", continent: "NA" },
  JO: { name: "Jordan", continent: "AS" },
  JP: { name: "Japan", continent: "AS" },
  KE: { name: "Kenya", continent: "AF" },
  KG: { name: "Kyrgyzstan", continent: "AS" },
  KH: { name: "Cambodia", continent: "AS" },
  KI: { name: "Kiribati", continent: "OC" },
  KM: { name: "Comoros", continent: "AF" },
  KN: { name: "Saint Kitts and Nevis", continent: "NA" },
  KP: { name: "North Korea", continent: "AS" },
  KR: { name: "South Korea", continent: "AS" },
  KW: { name: "Kuwait", continent: "AS" },
  KY: { name: "Cayman Islands", continent: "NA" },
  KZ: { name: "Kazakhstan", continent: "AS" },
  LA: { name: "Laos", continent: "AS" },
  LB: { name: "Lebanon", continent: "AS" },
  LC: { name: "Saint Lucia", continent: "NA" },
  LI: { name: "Liechtenstein", continent: "EU" },
  LK: { name: "Sri Lanka", continent: "AS" },
  LR: { name: "Liberia", continent: "AF" },
  LS: { name: "Lesotho", continent: "AF" },
  LT: { name: "Lithuania", continent: "EU" },
  LU: { name: "Luxembourg", continent: "EU" },
  LV: { name: "Latvia", continent: "EU" },
  LY: { name: "Libya", continent: "AF" },
  MA: { name: "Morocco", continent: "AF" },
  MC: { name: "Monaco", continent: "EU" },
  MD: { name: "Moldova", continent: "EU" },
  ME: { name: "Montenegro", continent: "EU" },
  MF: { name: "Saint Martin", continent: "NA" },
  MG: { name: "Madagascar", continent: "AF" },
  MH: { name: "Marshall Islands", continent: "OC" },
  MK: { name: "North Macedonia", continent: "EU" },
  ML: { name: "Mali", continent: "AF" },
  MM: { name: "Myanmar", continent: "AS" },
  MN: { name: "Mongolia", continent: "AS" },
  MO: { name: "Macau", continent: "AS" },
  MP: { name: "Northern Mariana Islands", continent: "OC" },
  MQ: { name: "Martinique", continent: "NA" },
  MR: { name: "Mauritania", continent: "AF" },
  MS: { name: "Montserrat", continent: "NA" },
  MT: { name: "Malta", continent: "EU" },
  MU: { name: "Mauritius", continent: "AF" },
  MV: { name: "Maldives", continent: "AS" },
  MW: { name: "Malawi", continent: "AF" },
  MX: { name: "Mexico", continent: "NA" },
  MY: { name: "Malaysia", continent: "AS" },
  MZ: { name: "Mozambique", continent: "AF" },
  NA: { name: "Namibia", continent: "AF" },
  NC: { name: "New Caledonia", continent: "OC" },
  NE: { name: "Niger", continent: "AF" },
  NG: { name: "Nigeria", continent: "AF" },
  NI: { name: "Nicaragua", continent: "NA" },
  NL: { name: "Netherlands", continent: "EU" },
  NO: { name: "Norway", continent: "EU" },
  NP: { name: "Nepal", continent: "AS" },
  NR: { name: "Nauru", continent: "OC" },
  NU: { name: "Niue", continent: "OC" },
  NZ: { name: "New Zealand", continent: "OC" },
  OM: { name: "Oman", continent: "AS" },
  PA: { name: "Panama", continent: "NA" },
  PE: { name: "Peru", continent: "SA" },
  PF: { name: "French Polynesia", continent: "OC" },
  PG: { name: "Papua New Guinea", continent: "OC" },
  PH: { name: "Philippines", continent: "AS" },
  PK: { name: "Pakistan", continent: "AS" },
  PL: { name: "Poland", continent: "EU" },
  PR: { name: "Puerto Rico", continent: "NA" },
  PS: { name: "Palestine", continent: "AS" },
  PT: { name: "Portugal", continent: "EU" },
  PW: { name: "Palau", continent: "OC" },
  PY: { name: "Paraguay", continent: "SA" },
  QA: { name: "Qatar", continent: "AS" },
  RE: { name: "Réunion", continent: "AF" },
  RO: { name: "Romania", continent: "EU" },
  RS: { name: "Serbia", continent: "EU" },
  RU: { name: "Russia", continent: "EU" },
  RW: { name: "Rwanda", continent: "AF" },
  SA: { name: "Saudi Arabia", continent: "AS" },
  SB: { name: "Solomon Islands", continent: "OC" },
  SC: { name: "Seychelles", continent: "AF" },
  SD: { name: "Sudan", continent: "AF" },
  SE: { name: "Sweden", continent: "EU" },
  SG: { name: "Singapore", continent: "AS" },
  SI: { name: "Slovenia", continent: "EU" },
  SK: { name: "Slovakia", continent: "EU" },
  SL: { name: "Sierra Leone", continent: "AF" },
  SM: { name: "San Marino", continent: "EU" },
  SN: { name: "Senegal", continent: "AF" },
  SO: { name: "Somalia", continent: "AF" },
  SR: { name: "Suriname", continent: "SA" },
  SS: { name: "South Sudan", continent: "AF" },
  ST: { name: "São Tomé and Príncipe", continent: "AF" },
  SV: { name: "El Salvador", continent: "NA" },
  SY: { name: "Syria", continent: "AS" },
  SZ: { name: "Eswatini", continent: "AF" },
  TD: { name: "Chad", continent: "AF" },
  TG: { name: "Togo", continent: "AF" },
  TH: { name: "Thailand", continent: "AS" },
  TJ: { name: "Tajikistan", continent: "AS" },
  TL: { name: "Timor-Leste", continent: "AS" },
  TM: { name: "Turkmenistan", continent: "AS" },
  TN: { name: "Tunisia", continent: "AF" },
  TO: { name: "Tonga", continent: "OC" },
  TR: { name: "Turkey", continent: "AS" },
  TT: { name: "Trinidad and Tobago", continent: "NA" },
  TV: { name: "Tuvalu", continent: "OC" },
  TW: { name: "Taiwan", continent: "AS" },
  TZ: { name: "Tanzania", continent: "AF" },
  UA: { name: "Ukraine", continent: "EU" },
  UG: { name: "Uganda", continent: "AF" },
  US: { name: "United States", continent: "NA" },
  UY: { name: "Uruguay", continent: "SA" },
  UZ: { name: "Uzbekistan", continent: "AS" },
  VA: { name: "Vatican City", continent: "EU" },
  VC: { name: "Saint Vincent and the Grenadines", continent: "NA" },
  VE: { name: "Venezuela", continent: "SA" },
  VG: { name: "British Virgin Islands", continent: "NA" },
  VI: { name: "U.S. Virgin Islands", continent: "NA" },
  VN: { name: "Vietnam", continent: "AS" },
  VU: { name: "Vanuatu", continent: "OC" },
  WS: { name: "Samoa", continent: "OC" },
  XK: { name: "Kosovo", continent: "EU" },
  YE: { name: "Yemen", continent: "AS" },
  ZA: { name: "South Africa", continent: "AF" },
  ZM: { name: "Zambia", continent: "AF" },
  ZW: { name: "Zimbabwe", continent: "AF" }
};

const continents = {
  AF: "#FFD700", // Africa - Oro
  AN: "#00FFFF", // Antartide - Ciano
  AS: "#FF4500", // Asia - Arancione Rosso
  EU: "#1E90FF", // Europa - Blu Dodger
  NA: "#32CD32", // Nord America - Verde Lime
  OC: "#FF69B4", // Oceania - Rosa Caldo
  SA: "#8B4513"  // Sud America - Marrone Sella
};

function App() {
  // DEFAULT VALUES
  const maxRows = 100;                  // Maximum number of rows to display in the tab 1 list view table
  const separator = '.';                // Separator for thousands in numbers
  const defaultStartYear = '2000';      // Default start year for the tab 1

  // Fetching cookie and data on first load
  useEffect(() => {
    const startApp = async () => {
      try {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        let response;
        const cookie = getCookie();
        const isValid = isCookieValid();
        if (!cookie || !isValid) {
          response = await fetch(`${API_BASE_URL}/cookie`, { signal });
        } else {
          response = await fetch(`${API_BASE_URL}/cookie?key=${cookie}`, { signal });
        }
        const data = await response.json();
        if (data.message === 'Ok') {
          setCookie(data.key, data.expires);
        }
        abortControllerRef.current.abort();
        setLastUpdateData();
        setViewsTab1();
        setDataTab2();
      } catch (error) {
        console.error("Error fetching data from /cookie:", error);
      }
    };
    startApp();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Function to refresh the cookie when the time is elapsed
  async function refreshCookie(signal) {
    try {
      deleteCookie();
      const response = await fetch(`${API_BASE_URL}/cookie`, { signal });
      const data = await response.json();
      setCookie(data.key, data.expires);
    } catch (error) {
      console.error("Error refreshing cookie:", error);
    } finally {
      cookieRefreshPromise = null;
    }
  }

  // Set a cookie with expiration in minutes
  function setCookie(value, minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    localStorage.setItem('cookie_expires', date.toUTCString());
    document.cookie = `key=${value}; ${expires}; path=/`;
  }

  // Get the cookie value by name
  function getCookie() {
    const nameEQ = "key=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  // Delete the cookie and its expiration tracking
  function deleteCookie() {
    document.cookie = "key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem('cookie_expires');
  }

  // Check if the cookie is still valid by comparing current time with the stored expiration
  function isCookieValid() {
    const cookie = getCookie();
    if (!cookie) {
      return false;
    }
    const expireDateStr = localStorage.getItem('cookie_expires');
    if (!expireDateStr) {
      return false;
    }
    const expireDate = new Date(expireDateStr).getTime();
    const now = Date.now();
    return expireDate > now;
  }

  // State for server calls
  const abortControllerRef = useRef(null);

  // Request for a resource
  let cookieRefreshPromise = null;
  const fetchData = async (endpoint, setter, signal) => {
    try {
      if (!isCookieValid()) {
        if (!cookieRefreshPromise) {
          cookieRefreshPromise = refreshCookie(signal);
        }
        await cookieRefreshPromise;
      }
      const sep = endpoint.includes('?') ? '&' : '?';
      const urlWithParams = `${endpoint}${sep}key=${getCookie()}`;
      const response = await fetch(API_BASE_URL + urlWithParams, { signal });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setter(data);
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
    }
  };

  // Track active tab
  const [activeTab, setActiveTab] = useState('tab1_1');

  // Resetting sort when switching tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'tab1_1') {
      document.getElementById('tab1map').classList.add('active');
      document.getElementById('tab1map').classList.add('show');
      document.getElementById('tab1list').classList.remove('active');
      document.getElementById('tab1list').classList.remove('show');
      document.getElementById('tab1-tab1map').classList.add('active');
      document.getElementById('tab1-tab1list').classList.remove('active');
    }
    if (tab === 'tab2_1') {
      document.getElementById('tab2inst').classList.add('active');
      document.getElementById('tab2inst').classList.add('show');
      document.getElementById('tab2coll').classList.remove('active');
      document.getElementById('tab2coll').classList.remove('show');
      document.getElementById('tab2-tab2inst').classList.add('active');
      document.getElementById('tab2-tab2coll').classList.remove('active');
    }
    setSelectedCountryTab2('');
  };

  // Track last update
  const [lastUpdate, setLastUpdate] = useState(null);

  // Setting last update date
  async function setLastUpdateData() {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      fetchData(`/lastUpdate`, setLastUpdate, signal);
    } catch (error) {
      console.error('Error fetching last update:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }

  useEffect(() => {
    if (lastUpdate) {
      const data = new Date(lastUpdate[0].last_update);
      const formattedDate = data.toLocaleDateString();
      const formattedTime = data.toLocaleTimeString();
      const lastUpdateElement = document.getElementById('last-update');
      lastUpdateElement.textContent = `Last updated: ${formattedDate} ${formattedTime}`;
    }
  }, [lastUpdate]);

  // Function to format numbers with thousands separator
  function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  const [departments, setDepartments] = useState([]);

  // TAB 1
  // Filters values
  const [departmentsTab1, setDepartmentsTab1] = useState([]);
  const [institutionsTab1, setInstitutionsTab1] = useState([]);
  const [topicsTab1, setTopicsTab1] = useState([]);
  const [openAccessStatusTab1, setOpenAccessStatusTab1] = useState([]);
  const [sdgsTab1, setSdgsTab1] = useState([]);
  const [yearsTab1, setYearsTab1] = useState([]);

  // Filters base values
  const [allInstitutionsTab1, setAllInstitutionsTab1] = useState([]);
  const [allTopicsTab1, setAllTopicsTab1] = useState([]);
  const [allOpenAccessStatusTab1, setAllOpenAccessStatusTab1] = useState([]);
  const [allSdgsTab1, setAllSdgsTab1] = useState([]);
  const [allYearsTab1, setAllYearsTab1] = useState([]);

  // Base values stored without filters
  const [allInstitutionCollaborationsTab1, setAllInstitutionCollaborationsTab1] = useState([]);
  const [allMapCollaborationsTab1, setAllMapCollaborationsTab1] = useState([]);
  const [allCollaborationsTab1, setAllCollaborationsTab1] = useState([]);
  const [allYearsCollaborationsTab1, setAllYearsCollaborationsTab1] = useState([]);

  // Values to populate map table and graph
  const [institutionCollaborationsTab1, setInstitutionCollaborationsTab1] = useState([]);
  const [mapCollaborationsTab1, setMapCollaborationsTab1] = useState([]);
  const [yearsCollaborationsTab1, setYearsCollaborationsTab1] = useState([]);
  const [collaborationsTab1, setCollaborationsTab1] = useState([]);
  const [collaborationsByCountryTab1, setCollaborationsByCountryTab1] = useState({});
  const [yearsDataTab1, setYearsDataTab1] = useState({});
  const [collaborationsByInstitutionTab1, setCollaborationsByInstitutionTab1] = useState({});

  // Selected filter values
  const [selectedInstitutionTab1, setSelectedInstitutionTab1] = useState('');
  const [selectedDepartmentTab1, setSelectedDepartmentTab1] = useState('');
  const [selectedTopicTab1, setSelectedTopicTab1] = useState('');
  const [selectedOpenAccessStatusTab1, setSelectedOpenAccessStatusTab1] = useState('');
  const [selectedSdgTab1, setSelectedSdgTab1] = useState('');
  const [selectedStartYearTab1, setSelectedStartYearTab1] = useState(defaultStartYear);
  const [selectedFinishYearTab1, setSelectedFinishYearTab1] = useState('');
  const [inputInstitutionTab1, setInputInstitutionTab1] = useState('');
  const [suggestionsInstitutionTab1, setSuggestionsInstitutionTab1] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update filter values
  const handleDepartmentChangeTab1 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_department_tab1');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedDepartmentTab1(value);
  };
  const handleTopicChangeTab1 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_topic_tab1');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedTopicTab1(value);
  };
  const handleOpenAccessStatusChangeTab1 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_oa_tab1');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedOpenAccessStatusTab1(value);
  };
  const handleSdgChangeTab1 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_sdg_tab1');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedSdgTab1(value);
  };
  let debounceTimeoutStart;
  const handleStartYearTab1 = event => {
    const year = event.target.value;
    clearTimeout(debounceTimeoutStart);
    debounceTimeoutStart = setTimeout(() => {
      if (year.length === 4) {
        setSelectedStartYearTab1(year);
      }
    }, 2000);
    document.getElementById('maxYearTab1').min = year;
  };
  let debounceTimeoutFinish;
  const handleFinishYearTab1 = event => {
    const year = event.target.value;
    clearTimeout(debounceTimeoutFinish);
    debounceTimeoutFinish = setTimeout(() => {
      if (year.length === 4) {
        setSelectedFinishYearTab1(year);
      }
    }, 2000);
    document.getElementById('minYearTab1').max = year;
  };
  const handleInstitutionChangeTab1 = event => {
    const value = event.target.value;
    setInputInstitutionTab1(value);
    const filteredSuggestions = institutionsTab1.filter((institution) =>
      institution.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestionsInstitutionTab1(filteredSuggestions);
    setShowSuggestions(true);
  };
  const handleSuggestionClickTab1 = (institution) => {
    const tooltip = document.getElementById('icon_institution_tab1');
    tooltip.style.backgroundColor = '#06de40';
    tooltip.innerHTML = '✓';
    setSelectedInstitutionTab1(institution.id_institution);
    setInputInstitutionTab1(institution.name);
    setSuggestionsInstitutionTab1([]);
    setShowSuggestions(false);
  };
  const handleBlur = () => {
    if (inputInstitutionTab1.trim() === "") {
      if (selectedInstitutionTab1 !== '') {
        const tooltip = document.getElementById('icon_institution_tab1');
        tooltip.style.backgroundColor = '#545d66';
        tooltip.innerHTML = '?';
        setInputInstitutionTab1('');
        setSelectedInstitutionTab1('');
      }
      setTimeout(() => setShowSuggestions(false), 200);
    }
  };
  const handleFocus = () => setShowSuggestions(true);

  // Values without filters
  async function setViewsTab1() {
    const tab = document.getElementById('tab1');
    if (!tab) {
      throw new Error("Element with ID 'tab1' not found");
    }
    tab.style.pointerEvents = 'none';
    tab.style.opacity = '0.7';
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      fetchData(`/institutionView`, setAllInstitutionsTab1, signal);
      fetchData(`/departmentView`, setDepartments, signal);
      fetchData(`/topicView`, setAllTopicsTab1, signal);
      fetchData(`/openAccessStatusView`, setAllOpenAccessStatusTab1, signal);
      fetchData(`/sdgView`, setAllSdgsTab1, signal);
      fetchData(`/yearView`, setAllYearsTab1, signal);
      fetchData(`/unimi/institutionCollaborationsView?${new URLSearchParams({ startYear: selectedStartYearTab1 })}`, setAllInstitutionCollaborationsTab1, signal);
      fetchData(`/unimi/collaborationsView`, setAllCollaborationsTab1, signal);
      fetchData(`/unimi/yearsView?${new URLSearchParams({ startYear: selectedStartYearTab1 })}`, setAllYearsCollaborationsTab1, signal);
      fetchData(`/unimi/countryView?${new URLSearchParams({ startYear: selectedStartYearTab1 })}`, setAllMapCollaborationsTab1, signal);
    } catch (error) {
      console.error('Error fetching data from views for tab 1:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }

  useEffect(() => setDepartmentsTab1(departments), [departments]);
  useEffect(() => setInstitutionsTab1(allInstitutionsTab1), [allInstitutionsTab1]);
  useEffect(() => setTopicsTab1(allTopicsTab1), [allTopicsTab1]);
  useEffect(() => setOpenAccessStatusTab1(allOpenAccessStatusTab1), [allOpenAccessStatusTab1]);
  useEffect(() => setSdgsTab1(allSdgsTab1), [allSdgsTab1]);
  useEffect(() => setYearsTab1(allYearsTab1), [allYearsTab1]);
  useEffect(() => setInstitutionCollaborationsTab1(allInstitutionCollaborationsTab1), [allInstitutionCollaborationsTab1]);
  useEffect(() => setMapCollaborationsTab1(allMapCollaborationsTab1), [allMapCollaborationsTab1]);
  useEffect(() => setCollaborationsTab1(allCollaborationsTab1), [allCollaborationsTab1]);
  useEffect(() => setYearsCollaborationsTab1(allYearsCollaborationsTab1), [allYearsCollaborationsTab1]);

  // Updating filters values
  useEffect(() => {
    const select = document.getElementById('select_department_tab1');
    select.innerHTML = '<option value="">Departments</option>';
    departmentsTab1.forEach(department => {
      const option = document.createElement('option');
      option.value = department.dipartimento;
      option.textContent = department.dipartimento;
      select.appendChild(option);
    });
    if (selectedDepartmentTab1 !== '') {
      select.value = selectedDepartmentTab1;
    }
    select.onchange = handleDepartmentChangeTab1;
  }, [departmentsTab1]);

  useEffect(() => {
    const select = document.getElementById('select_topic_tab1');
    select.innerHTML = '<option value="">Topics</option>';
    topicsTab1.forEach(subfield => {
      const option = document.createElement('option');
      option.value = subfield.id;
      option.textContent = subfield.name + " (" + subfield.field + ")";
      select.appendChild(option);
    });
    if (selectedTopicTab1 !== '') {
      select.value = selectedTopicTab1;
    }
    select.onchange = handleTopicChangeTab1;
  }, [topicsTab1]);

  useEffect(() => {
    const select = document.getElementById('select_oa_tab1');
    select.innerHTML = '<option value="">Open Access Status</option>';
    openAccessStatusTab1.forEach(status => {
      const option = document.createElement('option');
      option.value = status.openaccess_status;
      option.textContent = status.openaccess_status;
      select.appendChild(option);
    });
    if (selectedOpenAccessStatusTab1 !== '') {
      select.value = selectedOpenAccessStatusTab1;
    }
    select.onchange = handleOpenAccessStatusChangeTab1;
  }, [openAccessStatusTab1]);

  useEffect(() => {
    const select = document.getElementById('select_sdg_tab1');
    select.innerHTML = '<option value="">Sustainable Development Goals</option>';
    sdgsTab1.forEach(sdg => {
      const option = document.createElement('option');
      option.value = sdg.id;
      option.textContent = sdg.name;
      select.appendChild(option);
    });
    if (selectedSdgTab1 !== '') {
      select.value = selectedSdgTab1;
    }
    select.onchange = handleSdgChangeTab1;
  }, [sdgsTab1]);

  useEffect(() => {
    if (yearsTab1.length > 0) {
      const minYear = parseInt(defaultStartYear); // Default value
      const maxYear = parseInt(yearsTab1[0].max_year);
      document.getElementById('minYearTab1').placeholder = minYear;
      document.getElementById('maxYearTab1').placeholder = maxYear;
      document.getElementById('minYearTab1').min = minYear;
      document.getElementById('maxYearTab1').min = minYear;
      document.getElementById('minYearTab1').max = maxYear;
      document.getElementById('maxYearTab1').max = maxYear;
    }
  }, [yearsTab1]);

  // Blocking interactions when loading
  useEffect(() => {
    try {
      const tab = document.getElementById('tab1');
      if (!tab) {
        throw new Error("Element with ID 'tab1' not found");
      }
      tab.style.pointerEvents = 'none';
      tab.style.opacity = '0.7';
    } catch (error) {
      console.error('Error fetching data from views for tab 1:', error);
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Dynamic filter requests
  // Institution filter
  useEffect(() => {
    if (selectedDepartmentTab1 === '' && selectedTopicTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedSdgTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
      setInstitutionsTab1(allInstitutionsTab1);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        department: selectedDepartmentTab1,
        topic: selectedTopicTab1,
        openAccessStatus: selectedOpenAccessStatusTab1,
        sdg: selectedSdgTab1,
        startYear: selectedStartYearTab1,
        finishYear: selectedFinishYearTab1
      });
      try {
        fetchData(`/institution?${params}`, setInstitutionsTab1, signal);
      } catch (error) {
        console.error('Error fetching institution for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedDepartmentTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Department filter
  useEffect(() => {
    if (selectedInstitutionTab1 === '' && selectedTopicTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedSdgTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
      setDepartmentsTab1(departments);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        institution: selectedInstitutionTab1,
        topic: selectedTopicTab1,
        openAccessStatus: selectedOpenAccessStatusTab1,
        sdg: selectedSdgTab1,
        startYear: selectedStartYearTab1,
        finishYear: selectedFinishYearTab1
      });
      try {
        fetchData(`/department?${params}`, setDepartmentsTab1, signal);
      } catch (error) {
        console.error('Error fetching department for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedInstitutionTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Domain field subfield filter
  useEffect(() => {
    if (selectedInstitutionTab1 === '' && selectedDepartmentTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedSdgTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
      setTopicsTab1(allTopicsTab1);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        institution: selectedInstitutionTab1,
        department: selectedDepartmentTab1,
        openAccessStatus: selectedOpenAccessStatusTab1,
        sdg: selectedSdgTab1,
        startYear: selectedStartYearTab1,
        finishYear: selectedFinishYearTab1
      });
      try {
        fetchData(`/topic?${params}`, setTopicsTab1, signal);
      } catch (error) {
        console.error('Error fetching topic for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Open access status filter
  useEffect(() => {
    if (selectedInstitutionTab1 === '' && selectedDepartmentTab1 === '' && selectedTopicTab1 === '' && selectedSdgTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
      setOpenAccessStatusTab1(allOpenAccessStatusTab1);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        institution: selectedInstitutionTab1,
        department: selectedDepartmentTab1,
        topic: selectedTopicTab1,
        sdg: selectedSdgTab1,
        startYear: selectedStartYearTab1,
        finishYear: selectedFinishYearTab1
      });
      try {
        fetchData(`/openAccessStatus?${params}`, setOpenAccessStatusTab1, signal);
      } catch (error) {
        console.error('Error fetching open access for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedTopicTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // SDG filter
  useEffect(() => {
    if (selectedInstitutionTab1 === '' && selectedDepartmentTab1 === '' && selectedTopicTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
      setSdgsTab1(allSdgsTab1);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        institution: selectedInstitutionTab1,
        department: selectedDepartmentTab1,
        topic: selectedTopicTab1,
        openAccessStatus: selectedOpenAccessStatusTab1,
        startYear: selectedStartYearTab1,
        finishYear: selectedFinishYearTab1
      });
      try {
        fetchData(`/sdg?${params}`, setSdgsTab1, signal);
      } catch (error) {
        console.error('Error fetching sdg for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Year filter
  useEffect(() => {
    if (selectedInstitutionTab1 === '' && selectedDepartmentTab1 === '' && selectedTopicTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedSdgTab1 === '') {
      setYearsTab1(allYearsTab1);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        institution: selectedInstitutionTab1,
        department: selectedDepartmentTab1,
        topic: selectedTopicTab1,
        openAccessStatus: selectedOpenAccessStatusTab1,
        sdg: selectedSdgTab1
      });
      try {
        fetchData(`/year?${params}`, setYearsTab1, signal);
      } catch (error) {
        console.error('Error fetching year for tab 1:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedSdgTab1]);

  // Updating values when filters are selected
  useEffect(() => {
    if (activeTab === 'tab1_1' || activeTab === 'tab1_2') {
      document.getElementsByClassName('loading-container')[0].style.display = 'flex';
      document.getElementById('svgMapTab1').style.visibility = 'hidden';
      if (selectedInstitutionTab1 === '' && selectedDepartmentTab1 === '' && selectedTopicTab1 === '' && selectedOpenAccessStatusTab1 === '' && selectedSdgTab1 === '' && selectedStartYearTab1 === defaultStartYear && selectedFinishYearTab1 === '') {
        setInstitutionCollaborationsTab1(allInstitutionCollaborationsTab1);
        setMapCollaborationsTab1(allMapCollaborationsTab1);
        setCollaborationsTab1(allCollaborationsTab1);
        setYearsCollaborationsTab1(allYearsCollaborationsTab1);
      } else {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const params = new URLSearchParams({
          institution: selectedInstitutionTab1,
          department: selectedDepartmentTab1,
          topic: selectedTopicTab1,
          openAccessStatus: selectedOpenAccessStatusTab1,
          sdg: selectedSdgTab1,
          startYear: selectedStartYearTab1,
          finishYear: selectedFinishYearTab1
        });
        try {
          fetchData(`/unimi/countryCollaborations?${params}`, setMapCollaborationsTab1, signal);
          fetchData(`/unimi/collaborations?${params}`, setCollaborationsTab1, signal);
          fetchData(`/unimi/institutionCollaborations?${params}`, setInstitutionCollaborationsTab1, signal);
          fetchData(`/unimi/yearsCollaborations?${params}`, setYearsCollaborationsTab1, signal);
        } catch (error) {
          console.error('Error fetching data for tab 1:', error);
        }
        return () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }
      }
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedTopicTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  // Updating data for the map
  useEffect(() => {
    const collaborationsByCountry = {};
    mapCollaborationsTab1.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaboration_count);
      if (!isNaN(count)) {
        collaborationsByCountry[country] = { collabs: count };
      }
    });
    const number = document.getElementById('country_number_tab1');
    if (!number) {
      throw new Error("Element with ID 'country_number_tab1' not found");
    }
    number.innerHTML = formatNumber(Object.keys(collaborationsByCountry).length);
    setCollaborationsByCountryTab1(collaborationsByCountry);
  }, [mapCollaborationsTab1]);

  // Updating data for the table
  useEffect(() => {
    const collaborationsByInstitution = {};
    institutionCollaborationsTab1.forEach(row => {
      const institution = row.institution_name;
      const country = row.country;
      const key = `${institution}-${country}`;
      const count = parseInt(row.collaboration_count);
      const cit_count = parseInt(row.citation_count);
      if (!isNaN(count) && !isNaN(cit_count)) {
        collaborationsByInstitution[key] = { institution_name: institution, country: country, collabs: count, citations: cit_count };
      }
    });
    setCollaborationsByInstitutionTab1(collaborationsByInstitution);
  }, [institutionCollaborationsTab1]);

  // Updating data for the graph
  useEffect(() => {
    const yearsData = {};
    yearsCollaborationsTab1.forEach(row => {
      const year = parseInt(row.year);
      const inst = parseInt(row.institution_count);
      const coll = parseInt(row.collaboration_count);
      if (!isNaN(year) && !isNaN(inst) && !isNaN(coll)) {
        yearsData[year] = { collabs: coll, institutions: inst };
      }
    });
    setYearsDataTab1(yearsData);
  }, [yearsCollaborationsTab1]);

  // Updating data for University of Milan collaborations number
  useEffect(() => {
    try {
      if ((activeTab === 'tab1_1' || activeTab === 'tab1_2') && collaborationsTab1.length > 0) {
        const number1 = document.getElementById('work_number_tab1');
        const number2 = document.getElementById('author_number_tab1');
        const number3 = document.getElementById('institution_number_tab1');
        if (!number1 || !number2 || !number3) {
          throw new Error("Element not found");
        }
        number1.innerHTML = formatNumber(parseInt(collaborationsTab1[0].collaboration_count));
        number2.innerHTML = formatNumber(parseInt(collaborationsTab1[0].author_count));
        number3.innerHTML = formatNumber(parseInt(collaborationsTab1[0].institution_count));
      }
    } catch (error) {
      console.error('Error setting stats for tab 1:', error);
    }
  }, [collaborationsTab1]);

  // Updating lengend visibility when in tab 1_1
  useEffect(() => {
    if (activeTab === 'tab1_1') {
      document.getElementById('mapLegendTab1').style.display = 'flex';
    } else {
      document.getElementById('mapLegendTab1').style.display = 'none';
    }
  }, [activeTab]);

  // Updating the table
  useEffect(() => {
    if (activeTab === 'tab1_2') {
      const table = document.getElementById('table_institution_tab1');
      const rows = Object.entries(collaborationsByInstitutionTab1).map(([_, data]) => ({
        institution_name: data.institution_name,
        country: nations[data.country]?.name || data.country,
        collabs: formatNumber(data.collabs),
        citations: formatNumber(data.citations),
      })).slice(0, maxRows).map((collaboration) => `
          <tr>
            <td>${collaboration.institution_name}</td>
            <td>${collaboration.country}</td>
            <td>${collaboration.collabs}</td>
            <td>${collaboration.citations}</td>
          </tr>
        `).join('');
      table.innerHTML = rows;
    }
  }, [collaborationsByInstitutionTab1, activeTab]);

  // Upadating the graph
  const graphRef = useRef(null);
  useEffect(() => {
    if (activeTab === 'tab1_2') {
      try {
        if (!graphRef.current) {
          throw new Error("Graph reference is null");
        }
        const labels = Object.keys(yearsDataTab1).map(year => parseInt(year));
        const collabsData = Object.values(yearsDataTab1).map(data => data.collabs);
        const institutionsData = Object.values(yearsDataTab1).map(data => data.institutions);
        const ctx = graphRef.current.getContext('2d');
        if (!ctx) {
          throw new Error("Unable to get 2D context from graph reference");
        }
        if (window.myChart instanceof Chart) {
          window.myChart.destroy();
        }
        window.myChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Works',
                data: collabsData,
                borderColor: 'blue',
                fill: false
              },
              {
                label: 'Institutions',
                data: institutionsData,
                borderColor: 'green',
                fill: false
              }
            ]
          },
          options: {
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Year'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Count'
                }
              }
            }
          }
        });
        document.getElementsByClassName('loading-container')[0].style.display = 'none';
        document.getElementById('svgMapTab1').style.visibility = 'visible';
        const tab = document.getElementById('tab1');
        if (!tab) {
          throw new Error("Element with ID 'tab1' not found");
        }
        if (document.getElementById('country_number_tab1').innerHTML !== '0') {
          tab.style.pointerEvents = 'auto';
          tab.style.opacity = '1';
        }
      } catch (error) {
        console.error('Error setting graph for tab 1:', error);
      }
    }
  }, [yearsDataTab1, activeTab]);

  // Updating the map
  useEffect(() => {
    try {
      if ((activeTab === 'tab1_1') && Object.keys(collaborationsByCountryTab1).length > 0) {
        const mapContainer = document.getElementById('svgMapTab1');
        if (!mapContainer) {
          throw new Error("Element with ID 'svgMapTab1' not found");
        }
        mapContainer.innerHTML = '';
        const map = new svgMap({
          targetElementID: 'svgMapTab1',
          data: {
            data: {
              collabs: {
                name: 'Number of collaborations',
                format: '{0}',
                thousandSeparator: '\.'
              }
            },
            applyData: 'collabs',
            values: collaborationsByCountryTab1
          }
        });
        document.getElementsByClassName('loading-container')[0].style.display = 'none';
        mapContainer.style.visibility = 'visible';
        const tab = document.getElementById('tab1');
        if (!tab) {
          throw new Error("Element with ID 'tab1' not found");
        }
        if (document.getElementById('country_number_tab1').innerHTML !== '0') {
          tab.style.pointerEvents = 'auto';
          tab.style.opacity = '1';
        }

        let maxValue = 0;
        Object.keys(collaborationsByCountryTab1).forEach(country => {
          if (collaborationsByCountryTab1[country].collabs > maxValue) {
            maxValue = collaborationsByCountryTab1[country].collabs;
          }
        });

        // Legend
        const colorMax = '#CC0033';
        const colorMin = '#FFE5D9';
        const colorNoData = '#E2E2E2';
        const legend = document.getElementById('mapLegendTab1');
        if (!legend) {
          throw new Error("Element with ID 'mapLegendTab1' not found");
        }
        legend.innerHTML = `
          <div class="legend-label">Number of Collaborations: </div>
          <div class="legend-items">
          <div class="legend-item" style="background-color: ${colorNoData};">0</div>
          <div class="legend-item" style="background-color: ${colorMin};">${formatNumber(Math.round(maxValue * 0.01))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.25)};">${formatNumber(Math.round(maxValue * 0.25))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.5)};">${formatNumber(Math.round(maxValue * 0.5))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.75)};">${formatNumber(Math.round(maxValue * 0.75))}</div>
          <div class="legend-item" style="background-color: ${colorMax};">${formatNumber(maxValue)}</div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error setting map for tab 1:', error);
    }
  }, [collaborationsByCountryTab1]);

  // TAB 2
  // Filters Values
  const [authors, setAuthors] = useState([]);
  const [topicsTab2, setTopicsTab2] = useState([]);
  const [openAccessStatusTab2, setOpenAccessStatusTab2] = useState([]);
  const [sdgsTab2, setSdgsTab2] = useState([]);
  const [collaboratorsTab2, setCollaboratorsTab2] = useState([]);
  const [countriesTab2, setCountriesTab2] = useState([]);
  const [yearsTab2, setYearsTab2] = useState([]);
  const [infoTab2, setInfoTab2] = useState([]);

  // Selected filter values
  const [selectedAuthorTab2, setSelectedAuthorTab2] = useState('-1');
  const [selectedDepartmentTab2, setSelectedDepartmentTab2] = useState('');
  const [selectedTopicTab2, setSelectedTopicTab2] = useState('');
  const [selectedOpenAccessStatusTab2, setSelectedOpenAccessStatusTab2] = useState('');
  const [selectedSdgTab2, setSelectedSdgTab2] = useState('');
  const [selectedStartYearTab2, setSelectedStartYearTab2] = useState('');
  const [selectedFinishYearTab2, setSelectedFinishYearTab2] = useState('');
  const [selectedCollaboratorTab2, setSelectedCollaboratorTab2] = useState('');
  const [selectedCountryTab2, setSelectedCountryTab2] = useState('');

  // Base values stored without filters
  const [allAuthors, setAllAuthors] = useState([]);
  const [allTopicsTab2, setAllTopicsTab2] = useState([]);
  const [allOpenAccessStatusTab2, setAllOpenAccessStatusTab2] = useState([]);
  const [allSdgsTab2, setAllSdgsTab2] = useState([]);
  const [allYearsTab2, setAllYearsTab2] = useState([]);
  const [allCollaboratorsTab2, setAllCollaboratorsTab2] = useState([]);
  const [allCollaborationsByCountryTab2, setAllCollaborationsByCountryTab2] = useState([]);
  const [allCollaboratorsByCountryTab2, setAllCollaboratorsByCountryTab2] = useState([]);
  const [allCollaboratorsNumberTab2, setAllCollaboratorsNumberTab2] = useState([]);
  const [allCollaborationsTab2, setAllCollaborationsTab2] = useState([]);
  const [allCountryInstitutionsTab2, setAllCountryInstitutionsTab2] = useState([]);

  // Values to populate the tab
  const [collaborationsByCountryTab2, setCollaborationsByCountryTab2] = useState([]);
  const [collaboratorsByCountryTab2, setCollaboratorsByCountryTab2] = useState([]);
  const [collaborationsTab2, setCollaborationsTab2] = useState([]);
  const [collaboratorsNumberTab2, setCollaboratorsNumberTab2] = useState([]);
  const [countryInstitutionsTab2, setCountryInstitutionsTab2] = useState([]);
  const [countryCollaboratorsTab2, setCountryCollaboratorsTab2] = useState([]);
  const [mapInstitutionsTab2, setMapInstitutionsTab2] = useState([]);
  const [mapCollaboratorsTab2, setMapCollaboratorsTab2] = useState([]);

  // Update filter values
  const handleAuthorChangeTab2 = event => {
    const value = event.target.value;
    let tooltip = document.getElementById('icon_topic_tab2');
    tooltip.style.backgroundColor = '#545d66';
    tooltip.innerHTML = '?';
    tooltip = document.getElementById('icon_oa_tab2');
    tooltip.style.backgroundColor = '#545d66';
    tooltip.innerHTML = '?';
    tooltip = document.getElementById('icon_sdg_tab2');
    tooltip.style.backgroundColor = '#545d66';
    tooltip.innerHTML = '?';
    tooltip = document.getElementById('icon_collaborator_tab2');
    tooltip.style.backgroundColor = '#545d66';
    tooltip.innerHTML = '?';
    setSelectedAuthorTab2(value);
  };
  const handleDepartmentChangeTab2 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_department_tab2');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedDepartmentTab2(value);
  };
  const handleTopicChangeTab2 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_topic_tab2');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedTopicTab2(value);
  };
  const handleOpenAccessStatusChangeTab2 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_oa_tab2');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedOpenAccessStatusTab2(value);
  };
  const handleSdgChangeTab2 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_sdg_tab2');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedSdgTab2(value);
  };
  const handleStartYearTab2 = event => {
    const year = event.target.value;
    setSelectedStartYearTab2(year);
    document.getElementById('maxYearTab2').min = year;
  };
  const handleFinishYearTab2 = event => {
    const year = event.target.value;
    setSelectedFinishYearTab2(event.target.value);
    document.getElementById('minYearTab2').max = year;
  };
  const handleCollaboratorChangeTab2 = event => {
    const value = event.target.value;
    const tooltip = document.getElementById('icon_collaborator_tab2');
    if (value === '') {
      tooltip.style.backgroundColor = '#545d66';
      tooltip.innerHTML = '?';
    } else {
      tooltip.style.backgroundColor = '#06de40';
      tooltip.innerHTML = '✓';
    }
    setSelectedCollaboratorTab2(value);
  };
  const handleCountryChangeTab2 = event => setSelectedCountryTab2(event.target.value);

  // Values without filters
  async function setDataTab2() {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      fetchData(`/author/authors`, setAllAuthors, signal);
    } catch (error) {
      console.error('Error fetching authors for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }

  // Author data without filters
  useEffect(() => {
    if (selectedAuthorTab2 === '-1') {
      return;
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2
    });
    try {
      fetchData(`/year?${params}`, setAllYearsTab2, signal);
      fetchData(`/topic?${params}`, setAllTopicsTab2, signal);
      fetchData(`/openAccessStatus?${params}`, setAllOpenAccessStatusTab2, signal);
      fetchData(`/sdg?${params}`, setAllSdgsTab2, signal);
      fetchData(`/author/collaborators?${params}`, setAllCollaboratorsTab2, signal);
      fetchData(`/author/countryCollaborations?${params}`, setAllCollaborationsByCountryTab2, signal);
      fetchData(`/author/countryCollaborators?${params}`, setAllCollaboratorsByCountryTab2, signal);
      fetchData(`/author/collaboratorsCollaborations?${params}`, setAllCollaboratorsNumberTab2, signal);
      fetchData(`/author/collaborations?${params}`, setAllCollaborationsTab2, signal);
      fetchData(`/author/institutionsCountry?${params}`, setAllCountryInstitutionsTab2, signal);
      fetchData(`/author/info?${params}`, setInfoTab2, signal);
    } catch (error) {
      console.error('Error fetching author data for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [selectedAuthorTab2]);

  // Updating author informations
  useEffect(() => {
    try {
      const info = document.getElementById('author_info_tab2');
      if (!info) {
        throw new Error("Element with ID 'author_info_tab2' not found");
      }
      if (infoTab2.length > 0) {
        info.innerHTML = `${infoTab2[0].name} ${infoTab2[0].surname} belongs to the ${infoTab2[0].department}`;
      }
    } catch (error) {
      console.error('Error setting author info for tab 2:', error);
    }
  }, [infoTab2]);

  useEffect(() => setAuthors(allAuthors), [allAuthors]);
  useEffect(() => setTopicsTab2(allTopicsTab2), [allTopicsTab2]);
  useEffect(() => setOpenAccessStatusTab2(allOpenAccessStatusTab2), [allOpenAccessStatusTab2]);
  useEffect(() => setSdgsTab2(allSdgsTab2), [allSdgsTab2]);
  useEffect(() => setCollaboratorsTab2(allCollaboratorsTab2), [allCollaboratorsTab2]);
  useEffect(() => setYearsTab2(allYearsTab2), [allYearsTab2]);
  useEffect(() => setCollaborationsByCountryTab2(allCollaborationsByCountryTab2), [allCollaborationsByCountryTab2]);
  useEffect(() => setCollaboratorsByCountryTab2(allCollaboratorsByCountryTab2), [allCollaboratorsByCountryTab2]);
  useEffect(() => setCollaboratorsNumberTab2(allCollaboratorsNumberTab2), [allCollaboratorsNumberTab2]);
  useEffect(() => setCollaborationsTab2(allCollaborationsTab2), [allCollaborationsTab2]);
  useEffect(() => setCountryInstitutionsTab2(allCountryInstitutionsTab2), [allCountryInstitutionsTab2]);

  // Updating author when switching department
  useEffect(() => {
    const select = document.getElementById('select_author_tab2');
    select.innerHTML = '';
    select.value = selectedAuthorTab2;
    select.onchange = handleAuthorChangeTab2;
    authors.map(author => (
      select.innerHTML += `<option value=${author.id_author}>${author.surname} ${author.name}</option>`
    ));
    if (authors.length > 0) {
      setSelectedAuthorTab2(authors[0].id_author);
    }
  }, [authors]);

  // Update filters when switching author
  useEffect(() => {
    const select = document.getElementById('select_topic_tab2');
    select.innerHTML = '<option value="">Topics</option>';
    topicsTab2.forEach(subfield => {
      const option = document.createElement('option');
      option.value = subfield.id;
      option.textContent = subfield.name + " (" + subfield.field + ")";
      select.appendChild(option);
    });
    if (selectedTopicTab2 !== '') {
      select.value = selectedTopicTab2;
    }
    select.onchange = handleTopicChangeTab2;
  }, [topicsTab2]);

  useEffect(() => {
    const select = document.getElementById('select_oa_tab2');
    select.innerHTML = '<option value="">Open Access Status</option>';
    openAccessStatusTab2.forEach(status => {
      const option = document.createElement('option');
      option.value = status.openaccess_status;
      option.textContent = status.openaccess_status;
      select.appendChild(option);
    });
    if (selectedOpenAccessStatusTab2 !== '') {
      select.value = selectedOpenAccessStatusTab2;
    }
    select.onchange = handleOpenAccessStatusChangeTab2;
  }, [openAccessStatusTab2]);

  useEffect(() => {
    const select = document.getElementById('select_sdg_tab2');
    select.innerHTML = '<option value="">Sustainable Development Goals</option>';
    sdgsTab2.forEach(sdg => {
      const option = document.createElement('option');
      option.value = sdg.id;
      option.textContent = sdg.name;
      select.appendChild(option);
    });
    if (selectedSdgTab2 !== '') {
      select.value = selectedSdgTab2;
    }
    select.onchange = handleSdgChangeTab2;
  }, [sdgsTab2]);

  // Updating years filter
  useEffect(() => {
    if (yearsTab2.length > 0) {
      const minYear = parseInt(yearsTab2[0].min_year);
      const maxYear = parseInt(yearsTab2[0].max_year);
      document.getElementById('minYearTab2').placeholder = minYear;
      document.getElementById('maxYearTab2').placeholder = maxYear;
      document.getElementById('minYearTab2').min = minYear;
      document.getElementById('maxYearTab2').min = minYear;
      document.getElementById('minYearTab2').max = maxYear;
      document.getElementById('maxYearTab2').max = maxYear;
      document.getElementById('inst-coll-table').innerHTML = '';
    }
  }, [yearsTab2]);

  // Updating country filter
  useEffect(() => {
    const select = document.getElementById('select_country_tab2');
    select.value = selectedCountryTab2;
    select.onchange = handleCountryChangeTab2;
    select.innerHTML = '<option value="">Countries</option>';
    const sortedCountries = countriesTab2.sort((a, b) => {
      const nameA = nations[a.country_code]?.name || '';
      const nameB = nations[b.country_code]?.name || '';
      return nameA.localeCompare(nameB);
    });
    sortedCountries.forEach(country => {
      const countryName = nations[country.country_code]?.name || 'Unknown';
      select.innerHTML += `<option value="${country.country_code}">${countryName}</option>`;
    });
  }, [countriesTab2, activeTab]);

  // Updating collaborator filter
  useEffect(() => {
    const select = document.getElementById('select_coll_tab2');
    if (!select) {
      throw new Error("Element with ID 'select_country_tab2' not found");
    }
    select.value = selectedCollaboratorTab2;
    select.onchange = handleCollaboratorChangeTab2;
    select.innerHTML = '<option value="">Collaborator</option>';
    collaboratorsTab2.map(collaborator => (
      select.innerHTML += '<option value="' + collaborator.id_author + '">' + collaborator.surname + ' ' + collaborator.name + '</option>'
    ));
  }, [collaboratorsTab2]);

  // Showing select collaborator when in tab 2_2
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      document.getElementById('select_coll_tab2').classList.remove('d-none');
      document.getElementById('coll_tool_tab2').classList.remove('d-none');
    } else {
      document.getElementById('select_coll_tab2').classList.add('d-none');
      document.getElementById('coll_tool_tab2').classList.add('d-none');
    }
    if (activeTab === 'tab2_1') {
      setSelectedCollaboratorTab2('');
    }
  }, [activeTab]);

  // Updating numbers when in tab 2_1
  useEffect(() => {
    try {
      if (activeTab === 'tab2_1') {
        const text = document.getElementById('text_inst_coll');
        if (!text) {
          throw new Error("Element with ID 'text_inst_coll' not found");
        }
        text.innerHTML = 'Institutions';
        const number = document.getElementById('institution_collaborator_tab2');
        if (!number) {
          throw new Error("Element with ID 'institution_collaborator_tab2' not found");
        }
        number.innerHTML = formatNumber(parseInt(countryInstitutionsTab2.length));
        const table = document.getElementById('inst-coll-table');
        table.innerHTML = `
        <thead><tr>
          <th><span>Institution</span></th>
          <th><span>Collaborations</span></th>
        </tr></thead>`;
        countryInstitutionsTab2.forEach(row => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${row.institution_name}</td>`;
          tr.innerHTML += `<td>${formatNumber(row.collaboration_count)}</td>`;
          table.appendChild(tr);
        });
        setSelectedCollaboratorTab2('');
      }
    } catch (error) {
      console.error('Error setting institution field for tab 2:', error);
    }
  }, [activeTab, countryInstitutionsTab2]);

  // Updating numbers when in tab 2_2
  useEffect(() => {
    try {
      if (activeTab === 'tab2_2') {
        const text = document.getElementById('text_inst_coll');
        if (!text) {
          throw new Error("Element with ID 'text_inst_coll' not found");
        }
        text.innerHTML = 'Collaborators';
        const number = document.getElementById('institution_collaborator_tab2');
        if (!number) {
          throw new Error("Element with ID 'institution_collaborator_tab2' not found");
        }
        number.innerHTML = formatNumber(parseInt(collaboratorsNumberTab2[0].author_count));
      }
    } catch (error) {
      console.error('Error setting collaborator field for tab 2:', error);
    }
  }, [activeTab, collaboratorsNumberTab2]);

  // Blocking interactions when loading
  useEffect(() => {
    try {
      const tab = document.getElementById('tab2');
      if (!tab) {
        throw new Error("Element with ID 'tab2' not found");
      }
      tab.style.pointerEvents = 'none';
      tab.style.opacity = '0.7';
      document.getElementsByClassName('loading-container')[1].style.display = 'flex';
      document.getElementsByClassName('loading-container')[2].style.display = 'flex';
      document.getElementById('svgMapTab2').style.visibility = 'hidden';
      document.getElementById('graphTab2').style.visibility = 'hidden';
    } catch (error) {
      console.error('Error blocking interactions for tab 2:', error);
    }
  }, [selectedAuthorTab2, selectedDepartmentTab2, selectedTopicTab2, selectedOpenAccessStatusTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2]);

  // Author request when switching department
  useEffect(() => {
    if (selectedDepartmentTab2 === '') {
      setAuthors(allAuthors);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      try {
        fetchData(`/author/authors?${new URLSearchParams({ department: selectedDepartmentTab2 })}`, setAuthors, signal);
      } catch (error) {
        console.error('Error fetching authors for tab 2:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedDepartmentTab2]);

  // Dynamic filters requests
  // Topic filter
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      if (selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '' && selectedCollaboratorTab2 === '') {
        setTopicsTab2(allTopicsTab2);
        return;
      }
    } else {
      if (selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
        setTopicsTab2(allTopicsTab2);
        return;
      }
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    try {
      fetchData(`/topic?${params}`, setTopicsTab2, signal);
    } catch (error) {
      console.error('Error fetching topics for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [selectedOpenAccessStatusTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2, selectedCollaboratorTab2]);

  // Open Access Status filter
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      if (selectedTopicTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '' && selectedCollaboratorTab2 === '') {
        setOpenAccessStatusTab2(allOpenAccessStatusTab2);
        return;
      }
    } else {
      if (selectedTopicTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
        setOpenAccessStatusTab2(allOpenAccessStatusTab2);
        return;
      }
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      topic: selectedTopicTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    try {
      fetchData(`/openAccessStatus?${params}`, setOpenAccessStatusTab2, signal);
    } catch (error) {
      console.error('Error fetching open access status for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [selectedTopicTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2, selectedCollaboratorTab2]);

  // SDG filter
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '' && selectedCollaboratorTab2 === '') {
        setSdgsTab2(allSdgsTab2);
        return;
      }
    } else {
      if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
        setSdgsTab2(allSdgsTab2);
        return;
      }
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      topic: selectedTopicTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    try {
      fetchData(`/sdg?${params}`, setSdgsTab2, signal);
    } catch (error) {
      console.error('Error fetching sdg for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [selectedTopicTab2, selectedOpenAccessStatusTab2, selectedStartYearTab2, selectedFinishYearTab2, selectedCollaboratorTab2]);

  // Years filter
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedCollaboratorTab2 === '') {
        setYearsTab2(allYearsTab2);
        return;
      }
    } else {
      if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '') {
        setYearsTab2(allYearsTab2);
        return;
      }
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      topic: selectedTopicTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2
    });
    try {
      fetchData(`/year?${params}`, setYearsTab2, signal);
    } catch (error) {
      console.error('Error fetching years for tab 2:', error);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [selectedTopicTab2, selectedOpenAccessStatusTab2, selectedSdgTab2, selectedCollaboratorTab2]);

  // Collaborator filter
  useEffect(() => {
    if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
      setCollaboratorsTab2(allCollaboratorsTab2);
    } else {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        id: selectedAuthorTab2,
        topic: selectedTopicTab2,
        openAccessStatus: selectedOpenAccessStatusTab2,
        sdg: selectedSdgTab2,
        startYear: selectedStartYearTab2,
        finishYear: selectedFinishYearTab2
      });
      try {
        fetchData(`/author/collaborators?${params}`, setCollaboratorsTab2, signal);
      } catch (error) {
        console.error('Error fetching collaborators for tab 2:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedTopicTab2, selectedOpenAccessStatusTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2, activeTab]);

  // Updating values for institution and collaborators maps when filters are selected
  useEffect(() => {
    if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
      setCollaborationsByCountryTab2(allCollaborationsByCountryTab2);
      setCollaboratorsByCountryTab2(allCollaboratorsByCountryTab2);
      setCollaboratorsNumberTab2(allCollaboratorsNumberTab2);
    } else {
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        id: selectedAuthorTab2,
        topic: selectedTopicTab2,
        openAccessStatus: selectedOpenAccessStatusTab2,
        sdg: selectedSdgTab2,
        startYear: selectedStartYearTab2,
        finishYear: selectedFinishYearTab2
      });
      try {
        fetchData(`/author/countryCollaborations?${params}`, setCollaborationsByCountryTab2, signal);
        fetchData(`/author/countryCollaborators?${params}`, setCollaboratorsByCountryTab2, signal);
        fetchData(`/author/collaboratorsCollaborations?${params}`, setCollaboratorsNumberTab2, signal);
      } catch (error) {
        console.error('Error fetching country data for tab 2:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedTopicTab2, selectedOpenAccessStatusTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2]);

  // Updating collaborations number when filters are selected
  useEffect(() => {
    if (selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '' && selectedCollaboratorTab2 === '') {
      setCollaborationsTab2(allCollaborationsTab2);
    } else {
      const signal = abortControllerRef.current.signal;
      const params = new URLSearchParams({
        id: selectedAuthorTab2,
        collaborator: selectedCollaboratorTab2,
        topic: selectedTopicTab2,
        openAccessStatus: selectedOpenAccessStatusTab2,
        sdg: selectedSdgTab2,
        startYear: selectedStartYearTab2,
        finishYear: selectedFinishYearTab2
      });
      try {
        fetchData(`/author/collaborations?${params}`, setCollaborationsTab2, signal);
      } catch (error) {
        console.error('Error fetching stats for tab 2:', error);
      }
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }
  }, [selectedTopicTab2, selectedOpenAccessStatusTab2, selectedSdgTab2, selectedStartYearTab2, selectedFinishYearTab2, selectedCollaboratorTab2]);

  // Updating the institutions and collaborators collaborating with an author of a country
  useEffect(() => {
    if (activeTab === 'tab2_1') {
      if (selectedCountryTab2 === '' && selectedDepartmentTab2 === '' && selectedTopicTab2 === '' && selectedOpenAccessStatusTab2 === '' && selectedSdgTab2 === '' && selectedStartYearTab2 === '' && selectedFinishYearTab2 === '') {
        setCountryInstitutionsTab2(allCountryInstitutionsTab2);
      } else {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const params = new URLSearchParams({
          id: selectedAuthorTab2,
          topic: selectedTopicTab2,
          openAccessStatus: selectedOpenAccessStatusTab2,
          sdg: selectedSdgTab2,
          startYear: selectedStartYearTab2,
          finishYear: selectedFinishYearTab2,
          country: selectedCountryTab2
        });
        try {
          fetchData(`/author/institutionsCountry?${params}`, setCountryInstitutionsTab2, signal);
        } catch (error) {
          console.error('Error fetching institutions for tab 2:', error);
        }
        return () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }
      }
    }
    if (activeTab === 'tab2_2') {
      if (selectedCountryTab2 !== '') {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const params = new URLSearchParams({
          id: selectedAuthorTab2,
          topic: selectedTopicTab2,
          openAccessStatus: selectedOpenAccessStatusTab2,
          sdg: selectedSdgTab2,
          startYear: selectedStartYearTab2,
          finishYear: selectedFinishYearTab2,
          country: selectedCountryTab2
        });
        try {
          fetchData(`/author/collaboratorsCountry?${params}`, setCountryCollaboratorsTab2, signal);
        } catch (error) {
          console.error('Error fetching country collaborators for tab 2:', error);
        }
        return () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }
      } else {
        const number = document.getElementById('institution_collaborator_tab2');
        if (!number) {
          throw new Error("Element with ID 'institution_collaborator_tab2' not found");
        }
        number.innerHTML = formatNumber(parseInt(collaboratorsNumberTab2[0].author_count));
        document.getElementById('inst-coll-table').innerHTML = '';
      }
    }
  }, [selectedCountryTab2, activeTab]);

  // Updating data for the institutions map
  useEffect(() => {
    const collaborationsByCountry = {};
    const c = [];
    collaborationsByCountryTab2.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaboration_count);
      if (!isNaN(count) && country != null) {
        collaborationsByCountry[country] = { collabs: count };
        c.push({ country_code: country });
      }
    });
    setMapInstitutionsTab2(collaborationsByCountry);
    setCountriesTab2(c);
  }, [collaborationsByCountryTab2]);

  // Updating data for the collaborators map
  useEffect(() => {
    const collaboratorsByCountry = {};
    const c = [];
    collaboratorsByCountryTab2.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaborator_count);
      if (!isNaN(count) && country != null) {
        collaboratorsByCountry[country] = { collabs: count };
        c.push({ country_code: country });
      }
    });
    setMapCollaboratorsTab2(collaboratorsByCountry);
    setCountriesTab2(c);
  }, [collaboratorsByCountryTab2]);

  // Updating data for the number of collaborations
  useEffect(() => {
    try {
      if (collaborationsTab2.length > 0) {
        document.getElementById('work_number_tab2').innerHTML = formatNumber(parseInt(collaborationsTab2[0].collaboration_count));
      }
    } catch (error) {
      console.error('Error setting number of works for tab 2:', error);
    }
  }, [collaborationsTab2]);

  // Updating data for the collaborators table
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      if (selectedCountryTab2 !== '') {
        const number = document.getElementById('institution_collaborator_tab2');
        if (!number) {
          throw new Error("Element with ID 'institution_collaborator_tab2' not found");
        }
        number.innerHTML = formatNumber(parseInt(countryCollaboratorsTab2.length));
      }
      const table = document.getElementById('inst-coll-table');
      table.innerHTML = `
      <thead><tr>
        <th><span>Collaborator</span></th>
        <th><span>Institution</span></th>
        <th><span>Collaborations</span></th>
      </tr></thead>`;
      countryCollaboratorsTab2.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.surname} ${row.name}</td>`;
        tr.innerHTML += `<td>${row.institution_name}</td>
          <td>${formatNumber(row.collaboration_count)}</td>`;
        table.appendChild(tr);
      });
    }
  }, [countryCollaboratorsTab2, activeTab]);

  // Updating collaborations map
  useEffect(() => {
    setTimeout(() => {
      if (activeTab === 'tab2_1') {
        updateMapTab2();
      }
    }, 200);
  }, [mapInstitutionsTab2, activeTab]);

  // Updating collaborators graph
  useEffect(() => {
    setTimeout(() => {
      if (activeTab === 'tab2_2') {
        updateGraphTab2();
      }
    }, 200);
  }, [mapCollaboratorsTab2, activeTab]);

  // Instancing collaborations map
  const updateMapTab2 = () => {
    try {
      if (activeTab === 'tab2_1' && Object.keys(mapInstitutionsTab2).length > 0) {
        const mapContainer = document.getElementById('svgMapTab2');
        if (!mapContainer) {
          throw new Error("Element with ID 'svgMapTab2' not found");
        }
        mapContainer.innerHTML = '';
        const map = new svgMap({
          targetElementID: 'svgMapTab2',
          data: {
            data: {
              collabs: {
                name: 'Number of collaborations',
                format: '{0}',
                thousandSeparator: '\.'
              }
            },
            applyData: 'collabs',
            values: mapInstitutionsTab2
          }
        });

        document.getElementsByClassName('loading-container')[1].style.display = 'none';
        mapContainer.style.visibility = 'visible';
        const tab = document.getElementById('tab2');
        if (!tab) {
          throw new Error("Element with ID 'tab2' not found");
        }
        tab.style.pointerEvents = 'auto';
        tab.style.opacity = '1';

        let maxValue = 0;
        Object.keys(mapInstitutionsTab2).forEach(country => {
          if (mapInstitutionsTab2[country].collabs > maxValue) {
            maxValue = mapInstitutionsTab2[country].collabs;
          }
        });

        // Legend
        const colorMax = '#CC0033';
        const colorMin = '#FFE5D9';
        const colorNoData = '#E2E2E2';
        const legend = document.getElementById('mapLegendTab2');
        if (!legend) {
          throw new Error("Element with ID 'mapLegendTab2' not found");
        }
        legend.innerHTML = `
          <div class="legend-label">Number of Institutions: </div>
          <div class="legend-items">
          <div class="legend-item" style="background-color: ${colorNoData};">0</div>
          <div class="legend-item" style="background-color: ${colorMin};">${formatNumber(Math.round(maxValue * 0.01))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.25)};">${formatNumber(Math.round(maxValue * 0.25))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.5)};">${formatNumber(Math.round(maxValue * 0.5))}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.75)};">${formatNumber(Math.round(maxValue * 0.75))}</div>
          <div class="legend-item" style="background-color: ${colorMax};">${formatNumber(maxValue)}</div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error updating map for tab 2:', error);
    }
  };

  // Instancing collaborations graph
  const gridSpacing = 100;
  const continentPositions = {
    AF: { x: -300, y: 0 },
    AN: { x: 0, y: 300 },
    AS: { x: 300, y: 0 },
    EU: { x: 0, y: -300 },
    NA: { x: -300, y: -300 },
    OC: { x: 300, y: 300 },
    SA: { x: -300, y: 300 }
  };
  const updateGraphTab2 = () => {
    try {
      if (activeTab === 'tab2_2' && Object.keys(mapCollaboratorsTab2).length > 0) {
        const container = document.getElementById('graphTab2');
        if (!container) {
          throw new Error("Element with ID 'graphTab2' not found");
        }
        container.innerHTML = '';
        const nodes = new DataSet();
        const edges = new DataSet();
        const continentNodeCounts = {};

        for (const country in mapCollaboratorsTab2) {
          const collaborators = mapCollaboratorsTab2[country].collabs;
          const continentCode = nations[country].continent;
          const color = continents[continentCode];

          if (!continentNodeCounts[continentCode]) {
            continentNodeCounts[continentCode] = 0;
          }

          const basePosition = continentPositions[continentCode];
          const count = continentNodeCounts[continentCode];
          const row = Math.floor(count / 5);
          const col = count % 5;
          const xOffset = col * gridSpacing;
          const yOffset = row * gridSpacing;

          nodes.add({
            id: country,
            label: `${nations[country].name}\n${collaborators}`,
            value: collaborators,
            color: color,
            x: basePosition.x + xOffset,
            y: basePosition.y + yOffset
          });

          continentNodeCounts[continentCode]++;

          if (country !== 'IT') {
            edges.add({ from: 'IT', to: country });
          }
        }

        const options = {
          nodes: {
            shape: 'dot',
            scaling: {
              customScalingFunction: function (min, max, total, value) {
                return value / total;
              },
              min: 10,
              max: 70,
            },
            font: {
              size: 14,
            },
          },
          layout: {
            improvedLayout: false,
            hierarchical: false,
          },
          physics: {
            enabled: true,
            barnesHut: {
              gravitationalConstant: -8000,
              springLength: 200,
              springConstant: 0.04,
              damping: 0.09
            },
            stabilization: {
              iterations: 2500
            }
          }
        };

        new Network(container, { nodes: nodes, edges: edges }, options);
        document.getElementsByClassName('loading-container')[2].style.display = 'none';
        container.style.visibility = 'visible';
        const tab = document.getElementById('tab2');
        if (!tab) {
          throw new Error("Element with ID 'tab2' not found");
        }
        tab.style.pointerEvents = 'auto';
        tab.style.opacity = '1';

        // Legend
        const legend = document.getElementById('mapLegendTab2');
        if (!legend) {
          throw new Error("Element with ID 'mapLegendTab2' not found");
        }
        legend.innerHTML = `<div class="legend-label">Continents: </div><div class="legend-items">`;
        for (const continentCode in continents) {
          legend.innerHTML += `<div class="legend-item" style="background-color: ${continents[continentCode]};">${continentCode}</div>`;
        }
        legend.innerHTML += `</div>`;
      }
    } catch (error) {
      console.error('Error updating graph tab 2:', error);
    }
  };

  return (
    <div className="App container-fluid">
      <CookiePopup />
      <div className="row">
        <div className="col" style={{ padding: '0px' }}>
          <div className='navtab'>
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="tab1-tab" data-toggle="tab" href="#tab1" role="tab" aria-controls="tab1" aria-selected="true" onClick={() => handleTabChange('tab1_1')}>Institution Collaborations</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab2-tab" data-toggle="tab" href="#tab2" role="tab" aria-controls="tab2" aria-selected="false" onClick={() => handleTabChange('tab2_1')}>Author Collaboration</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab3-tab" data-toggle="tab" href="#tab3" role="tab" aria-controls="tab3" aria-selected="false" onClick={() => handleTabChange('tab3')}>About</a>
              </li>
            </ul>
          </div>
          <div className="tab-content">
            <div className="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
              <div id="unimi_collaborations">
                <div className="card">
                  <div className="row justify-content-around">
                    <div className="card-body row justify-content-around">
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <form id="institution_input">
                            <input type="text" value={inputInstitutionTab1} onChange={handleInstitutionChangeTab1} placeholder="Institutions" onBlur={handleBlur} onFocus={handleFocus} />
                            {showSuggestions && (
                              <ul className='suggestion-list'>
                                {suggestionsInstitutionTab1.map((institution) => (
                                  <li onClick={() => handleSuggestionClickTab1(institution)}>
                                    {institution.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </form>
                          <div className="tooltip-container">
                            <span id='icon_institution_tab1' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Click and digit the name of an institution to search for all its collaborations with the University of Milan</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_department_tab1' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_department_tab1' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a department of the University of Milan to search for all its collaborations with other countries and institutions</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_topic_tab1' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_topic_tab1' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a topic to search for all works related to that topic</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_oa_tab1' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_oa_tab1' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select an open access status to search for all works with that status</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_sdg_tab1' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_sdg_tab1' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a sustainable development goal to search for all works related to that sdg</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <input type="number" id="minYearTab1" name="minYear" onChange={handleStartYearTab1}></input>
                        <input type="number" id="maxYearTab1" name="maxYear" onChange={handleFinishYearTab1}></input>
                      </div>
                    </div>
                    <div className="row justify-content-around">
                      <div id='tab1-left' className="col-md-4">
                        <div id='statTab1'>
                          <div className="row g-0 justify-content-around">
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='author_number_tab1' className='number'></div>
                                <div className='text'>Collaborators</div>
                              </div>
                            </div>
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='country_number_tab1' className='number'></div>
                                <div className='text'>Countries</div>
                              </div>
                            </div>
                          </div>
                          <div className="row g-0 justify-content-around">
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='institution_number_tab1' className='number'></div>
                                <div className='text'>Institutions</div>
                              </div>
                            </div>
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='work_number_tab1' className='number'></div>
                                <div className='text'>Works</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div id='table-top10' className='table-container'>
                          <table className="table">
                            <thead>
                              <tr>
                                <th><span>Top 10</span></th>
                                <th><span>Country</span></th>
                                <th><span>Collaborations</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(collaborationsByCountryTab1).sort((a, b) => b[1].collabs - a[1].collabs).slice(0, 10).map(([country, data], index) => (
                                <tr>
                                  <td>{index + 1}</td>
                                  <td>{nations[country].name}</td>
                                  <td>{formatNumber(data.collabs)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className='row'>
                          <div id='nav-tab1' className='col-12 col-md-4'>
                            <ul className="nav nav-tabs" role="tablist">
                              <li className="nav-item">
                                <a className="nav-link active" id="tab1-tab1map" data-toggle="tab" href="#tab1map" role="tab" aria-controls="tab1map" aria-selected="true" onClick={() => handleTabChange('tab1_1')}>Map View</a>
                              </li>
                              <li className="nav-item">
                                <a className="nav-link" id="tab1-tab1list" data-toggle="tab" href="#tab1list" role="tab" aria-controls="tab1list" aria-selected="false" onClick={() => handleTabChange('tab1_2')}>List View</a>
                              </li>
                            </ul>
                          </div>
                          <div className='col-12 col-md-8'>
                            <div id="mapLegendTab1" className='legend-container'></div>
                          </div>
                        </div>
                        <div className="tab-content">
                          <div className="tab-pane fade show active" id="tab1map" role="tabpanel" aria-labelledby="tab1-tab1map">
                            <div className='svgMap'>
                              <div className="loading-container">
                                <div className="loading-progress"></div>
                              </div>
                              <div id="svgMapTab1"></div>
                            </div>
                          </div>
                          <div className="tab-pane fade" id="tab1list" role="tabpanel" aria-labelledby="tab1-tab1list">
                            <div id='list-view'>
                              <div id='table-view' className='row table-container'>
                                <table className="table">
                                  <thead>
                                    <tr>
                                      <th>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Institution Name</span>
                                        </div>
                                      </th>
                                      <th>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Country</span>
                                        </div>
                                      </th>
                                      <th>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Collaborations</span>
                                        </div>
                                      </th>
                                      <th>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Citations</span>
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody id='table_institution_tab1'></tbody>
                                </table>
                              </div>
                              <div id='graph'>
                                <canvas ref={graphRef} id='graph-wrapper'></canvas>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tab-pane fade" id="tab2" role="tabpanel" aria-labelledby="tab2-tab">
              <div id="author_collaborations">
                <div id='tab2' className="card">
                  <div className="row justify-content-around">
                    <div className="card-body row justify-content-around">
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select className="form-select" value={selectedDepartmentTab2} onChange={handleDepartmentChangeTab2}>
                            <option value="">Departments</option>
                            {departments.map(department => (
                              <option value={department.dipartimento}>{department.dipartimento}</option>
                            ))}
                          </select>
                          <div className="tooltip-container">
                            <span id='icon_department_tab2' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a department of the University of Milan to search for authors from that department</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <div className="tooltip-container">
                            <select id='select_author_tab2' className="form-select"></select>
                            <span id='author_info_tab2' className="tooltip-text"></span>
                          </div>
                          <div className="tooltip-container">
                            <span id='icon_author_tab2' className="tooltip-icon" style={{ backgroundColor: '#06de40' }}>✓</span>
                            <span className="tooltip-text">Select an author from the University of Milan to search all their collaborations. Type the letters to help finding someone</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_topic_tab2' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_topic_tab2' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a topic to search for all works related to that topic</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_oa_tab2' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_oa_tab2' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select an open access status to search for all works with that status</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <div className="card-text filter">
                          <select id='select_sdg_tab2' className="form-select"></select>
                          <div className="tooltip-container">
                            <span id='icon_sdg_tab2' className="tooltip-icon">?</span>
                            <span className="tooltip-text">Select a sustainable development goal to search for all works related to that sdg</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-10 col-md-2">
                        <input type="number" id="minYearTab2" name="minYear" onChange={handleStartYearTab2}></input>
                        <input type="number" id="maxYearTab2" name="maxYear" onChange={handleFinishYearTab2}></input>
                      </div>
                    </div>
                    <div className="row justify-content-around">
                      <div id='tab2-left' className="col-md-4">
                        <div id='statTab2'>
                          <div className="row g-0 justify-content-around">
                            <div className="col-md-6">
                              <div className="card-text filter">
                                <select id='select_coll_tab2' className="form-select d-none"></select>
                                <div id='coll_tool_tab2' className="tooltip-container d-none">
                                  <span id='icon_collaborator_tab2' className="tooltip-icon">?</span>
                                  <span className="tooltip-text">Select a collaborator to search for all works with that person</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="row col-12 g-0 justify-content-around">
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='work_number_tab2' className='number'></div>
                                <div className='text'>Collaborations</div>
                              </div>
                            </div>
                            <div className='col-6 col-md-5'>
                              <div className="number-box">
                                <div id='institution_collaborator_tab2' className='number'></div>
                                <div id='text_inst_coll' className='text'>Institutions</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div id='country-table'>
                          <div className="row g-0 justify-content-around">
                            <div className="col-md-5">
                              <div className="card-text filter">
                                <select id='select_country_tab2' className="form-select"></select>
                              </div>
                            </div>
                          </div>
                          <div className="row g-0 justify-content-around">
                            <div id='inst-coll' className='table-container'>
                              <table className="table" id='inst-coll-table'></table>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className='row'>
                          <div id='nav-tab2' className='col-md-4'>
                            <ul className="nav nav-tabs" role="tablist">
                              <li className="nav-item">
                                <a className="nav-link active" id="tab2-tab2inst" data-toggle="tab" href="#tab2inst" role="tab" aria-controls="tab2inst" aria-selected="true" onClick={() => handleTabChange('tab2_1')}>Institutions</a>
                              </li>
                              <li className="nav-item">
                                <a className="nav-link" id="tab2-tab2coll" data-toggle="tab" href="#tab2coll" role="tab" aria-controls="tab2coll" aria-selected="false" onClick={() => handleTabChange('tab2_2')}>Collaborators</a>
                              </li>
                            </ul>
                          </div>
                          <div className='col-md-8'>
                            <div id="mapLegendTab2" className='legend-container'></div>
                          </div>
                        </div>
                        <div className="tab-content">
                          <div className="tab-pane fade show active" id="tab2inst" role="tabpanel" aria-labelledby="tab2-tab2inst">
                            <div className='svgMap'>
                              <div className="loading-container">
                                <div className="loading-progress"></div>
                              </div>
                              <div id="svgMapTab2"></div>
                            </div>
                          </div>
                          <div className="tab-pane fade" id="tab2coll" role="tabpanel" aria-labelledby="tab2-tab2coll">
                            <div className='graph'>
                              <div className="loading-container">
                                <div className="loading-progress"></div>
                              </div>
                              <div id="graphTab2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tab-pane fade" id="tab3" role="tabpanel" aria-labelledby="tab3-tab">
              <div className="overview">
                <div id='about' className="card-body">
                  <h3>Information about the University of Milan Collaborations Dashboard</h3>
                  <p>The Milan collaboration dashboard monitors the collaborations of the University with other research institutions and researchers.</p>
                  <p><big><b>Who produces this dashboard? </b></big>The dashboard is the result of the collaboration of the Unit that support open science with the computer science department. The dashboard was elaborated by Andrea Perini and Ievgen Potanov as object of their thesis tutored by prof. Montanelli</p>
                  <p><big><b>Why the dashboard? </b></big>It is part of the committment of the University of Milan, as signatory Of the Barcelona Declaration, for the openness of research information.</p>
                  <p><big><b>For whom? </b></big>The dashboard is intended for internal and external researchers as a tool for identifying scientific collaborations. The dashboard can also be interesting for managers, journalists, and anyone else with an interest in the scientific performance of universities.</p>
                  <p><big><b>Data </b></big>The dashboard is based on bibliographic data from the OpenAlex database produced by OurResearch, enriched  and matched with the data of AIR, the institutional certified repository of the University.</p>
                  <p><big><b>Indicators </b></big>The dashboard offers two views of the collaborations of the University: Institution Collaborations and Author collaborations. Below are detailed indicators and filters of each one.</p>
                  <ul>
                    <li>Institution Collaborations: herethe dashboard displays works (publications of researchers of the University of Milan), collaborators (coauthors of works), institutions (affiliations declared by coauthors in the works) and countries (countries of the institutions declared by authors in the works).</li>
                    <li>Author collaborations: here the dashboard displays collaborations (coauthors of works), and institutions (affiliations declared by coauthors in the works).</li>
                  </ul>
                  <p><big><b>Filters </b></big>Common filters are departments of the University of Milan, topics (the subfields of the OpenAlex classification detailed <a href="https://docs.openalex.org/api-entities/topics">here</a>), open access status (see <a href="https://docs.openalex.org/api-entities/works/work-object#oa_status">here</a>), Sustainable Development Goal and year (MICollD cover the time span from 2000 to 2024). In Author Collaborations the country is a filter.</p>
                  <p><big><b>Data visualization </b></big>In both Institution Collaborations and Author Collaboration views data are presented  IN a table below and a map view. In Institutions Collaborations TAB map can be switched to a List View with a list of the institutions and a graph showing the trend of works and institution per year. In Author Collaboration TAB the map can be switched to a Collaborators view consisting in a graph showing the distribution per country of the collaborators.</p>
                  <div id='about-info'>
                    <p id='last-update'>Last updated:</p>
                    <p id='gui-version'>GUI version {gui_version}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
