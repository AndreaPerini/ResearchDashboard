import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import svgMap from 'svgmap';
import 'svgmap/dist/svgMap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Chart from 'chart.js/auto';

// Server URL
const API_BASE_URL = 'http://localhost:3001';

function App() {
  // Filters values
  const [departments, setDepartments] = useState([]);
  const [subfields, setDomainFieldSubfields] = useState([]);
  const [openAccessStatuses, setOpenAccessStatuses] = useState([]);
  const [sdgs, setSdgs] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Track active tab
  const [activeTab, setActiveTab] = useState('tab1_1');

  const abortControllerRef = useRef(null);

  // Filters requests
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    fetchData('/departments', setDepartments, signal);
    fetchData('/domainFieldSubfields', setDomainFieldSubfields, signal);
    fetchData('/openAccessStatuses', setOpenAccessStatuses, signal);
    fetchData('/sdgs', setSdgs, signal);
    fetchData('/authors', setAuthors, signal);
    fetchData('/institutions', setInstitutions, signal);

    return () => {
      abortControllerRef.current.abort();
    };
  }, []);

  // Request for a resource
  const fetchData = async (endpoint, setter, signal) => {
    await fetch(API_BASE_URL + endpoint, { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setter(data))
      .catch(error => console.error(`Error fetching data from ${endpoint}:`, error));
  };

  // Functions to sort a column of a table
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = (data) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      if (sortColumn === 'collabs' || sortColumn === 'citations') {
        const aValue = parseInt(a[sortColumn]);
        const bValue = parseInt(b[sortColumn]);
        if (isNaN(aValue)) return 1;
        if (isNaN(bValue)) return -1;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        if (a[sortColumn] < b[sortColumn]) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (a[sortColumn] > b[sortColumn]) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  };

  // Resetting sort when switching tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSortColumn(null);
    setSortDirection('asc');
    if (tab === 'tab1_1') {
      document.getElementById('mapLegendTab1').style.display = 'flex';
      updateMap();
    } else {
      document.getElementById('mapLegendTab1').style.display = 'none';
    }
  };

  // TAB 1
  // Filters Values
  const [selectedDepartmentTab1, setSelectedDepartmentTab1] = useState('');
  const [selectedDomainFieldSubfieldTab1, setSelectedDomainFieldSubfieldTab1] = useState('');
  const [selectedOpenAccessStatusTab1, setSelectedOpenAccessStatusTab1] = useState('');
  const [selectedSdgTab1, setSelectedSdgTab1] = useState('');
  const [selectedInstitutionTab1, setSelectedInstitutionTab1] = useState([]);
  const [selectedStartYearTab1, setSelectedStartYearTab1] = useState('2000');
  const [selectedFinishYearTab1, setSelectedFinishYearTab1] = useState('');
  const [inputInstitutionTab1, setInputInstitutionTab1] = useState('');
  const [suggestionsInstitutionTab1, setSuggestionsInstitutionTab1] = useState([]);

  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    const fetchYears = async () => {
      await fetch(API_BASE_URL + '/year', { signal })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          const minYear = 2000;
          const maxYear = parseInt(data[0].max_year);
          document.getElementById('minYearTab1').placeholder = minYear;
          document.getElementById('maxYearTab1').placeholder = maxYear;
          document.getElementById('minYearTab1').min = minYear;
          document.getElementById('maxYearTab1').min = minYear;
          document.getElementById('minYearTab1').max = maxYear;
          document.getElementById('maxYearTab1').max = maxYear;
        })
        .catch(error => console.error(`Error fetching data from years:`, error));
    };
    fetchYears();
  }, []);


  // Update filter values
  const handleDepartmentChangeTab1 = event => setSelectedDepartmentTab1(event.target.value);
  const handleDomainFieldSubfieldChangeTab1 = event => setSelectedDomainFieldSubfieldTab1(event.target.value);
  const handleOpenAccessStatusChangeTab1 = event => setSelectedOpenAccessStatusTab1(event.target.value);
  const handleSdgChangeTab1 = event => setSelectedSdgTab1(event.target.value);
  const handleStartYearTab1 = event => {
    const year = event.target.value;
    setSelectedStartYearTab1(year);
    document.getElementById('maxYearTab1').min = year;
  };
  const handleFinishYearTab1 = event => {
    const year = event.target.value;
    setSelectedFinishYearTab1(event.target.value);
    document.getElementById('minYearTab1').max = year;
  };
  const handleInstitutionChangeTab1 = (event) => {
    const value = event.target.value;
    setInputInstitutionTab1(value);
    const filteredSuggestions = institutions.filter((institution) =>
      institution.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestionsInstitutionTab1(filteredSuggestions);
  };
  const handleSuggestionClickTab1 = (institution) => {
    setSelectedInstitutionTab1(institution.id_institution);
    setInputInstitutionTab1(institution.name);
    setSuggestionsInstitutionTab1([]);
  };

  // Values to populate the map
  const [institutionCollaborationsTab1, setInstitutionCollaborationsTab1] = useState([]);
  const [mapCollaborationsTab1, setMapCollaborationsTab1] = useState([]);
  const [yearsCollaborationsTab1, setYearsCollaborationsTab1] = useState([]);
  const [collaboratorsTab1, setCollaboratorsTab1] = useState([]);
  const [collaborationsTab1, setCollaborationsTab1] = useState([]);
  const [collaborationsByCountryTab1, setCollaborationsByCountryTab1] = useState({});
  const [yearsDataTab1, setYearsDataTab1] = useState({});
  const [collaborationsByInstitutionTab1, setCollaborationsByInstitutionTab1] = useState({});

  // Refreshing values when filters are selected
  useEffect(() => {
    const signal = abortControllerRef.current.signal;

    fetchData(`/mapCollaborations?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
      startYear: selectedStartYearTab1,
      finishYear: selectedFinishYearTab1
    })}`, setMapCollaborationsTab1, signal);

    fetchData(`/collaborators?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
      startYear: selectedStartYearTab1,
      finishYear: selectedFinishYearTab1
    })}`, setCollaboratorsTab1, signal);

    fetchData(`/collaborations?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
      startYear: selectedStartYearTab1,
      finishYear: selectedFinishYearTab1
    })}`, setCollaborationsTab1, signal);

    fetchData(`/institutionCollaborations?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
      startYear: selectedStartYearTab1,
      finishYear: selectedFinishYearTab1
    })}`, setInstitutionCollaborationsTab1, signal);

    fetchData(`/yearsCollaborations?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
      startYear: selectedStartYearTab1,
      finishYear: selectedFinishYearTab1
    })}`, setYearsCollaborationsTab1, signal);
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

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
    document.getElementById('country_number').innerHTML = Object.keys(collaborationsByCountry).length;
    setCollaborationsByCountryTab1(collaborationsByCountry);
    updateMap();
  }, [mapCollaborationsTab1]);

  // Updating data for the table
  useEffect(() => {
    const collaborationsByInstitution = {};
    institutionCollaborationsTab1.forEach(row => {
      const institution = row.institution_name;
      const country = row.country;
      const count = parseInt(row.collaboration_count);
      const cit_count = parseInt(row.citation_count);
      if (!isNaN(count) && !isNaN(cit_count)) {
        collaborationsByInstitution[institution] = { country: country, collabs: count, citations: cit_count };
      }
    });
    document.getElementById('institution_number').innerHTML = Object.keys(collaborationsByInstitution).length;
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
    updateGraph();
  }, [yearsCollaborationsTab1]);

  // Updating data for the collaborators number
  useEffect(() => {
    try {
      if (collaboratorsTab1.length === 0) {
        throw new Error("No author found");
      }
      document.getElementById('author_number').innerHTML = parseInt(collaboratorsTab1[0].total_authors);
    } catch (error) {
    }
  }, [collaboratorsTab1]);

  // Updating data for the collaborations number
  useEffect(() => {
    try {
      if (collaborationsTab1.length === 0) {
        throw new Error("No works found");
      }
      document.getElementById('work_number').innerHTML = parseInt(collaborationsTab1[0].total_works);
    } catch (error) {
    }
  }, [collaborationsTab1]);

  // Upadating the graph
  useEffect(() => {
    if (activeTab === 'tab1_2') {
      updateGraph();
    }
    setTimeout(() => {
      if (activeTab === 'tab1_2') {
        updateGraph();
      }
    }, 500);
  }, [yearsDataTab1, activeTab]);

  // Updating the map
  useEffect(() => {
    if (activeTab === 'tab1_1') {
      updateMap();
    }
    setTimeout(() => {
      if (activeTab === 'tab1_1') {
        updateMap();
      }
    }, 500);
  }, [collaborationsByCountryTab1, activeTab]);

  // Instancing the map
  const updateMap = () => {
    try {
      if (activeTab === 'tab1_1') {
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
                thousandSeparator: '\''
              }
            },
            applyData: 'collabs',
            values: collaborationsByCountryTab1
          }
        });

        var maxValue = 0;
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
          <div class="legend-item" style="background-color: ${colorMin};">${Math.round(maxValue * 0.01)}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.25)};">${Math.round(maxValue * 0.25)}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.5)};">${Math.round(maxValue * 0.5)}</div>
          <div class="legend-item" style="background-color: ${map.getColor(colorMax, colorMin, 0.75)};">${Math.round(maxValue * 0.75)}</div>
          <div class="legend-item" style="background-color: ${colorMax};">${maxValue}</div>
          </div>
        `;
      }
    } catch (error) {
    }
  };

  // Update graph
  const graphRef = useRef(null);
  const updateGraph = () => {
    try {
      if (activeTab === 'tab1_2') {
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
      }
    } catch (error) {
    }
  }

  // TAB 2
  // Filters Values
  const [selectedDomainFieldSubfieldTab2, setSelectedDomainFieldSubfieldTab2] = useState('');
  const [selectedOpenAccessStatusTab2, setSelectedOpenAccessStatusTab2] = useState('');
  const [selectedSdgTab2, setSelectedSdgTab2] = useState('');
  const [selectedAuthorTab2, setSelectedAuthorTab2] = useState('');

  // Update filter values
  const handleDomainFieldSubfieldChangeTab2 = event => setSelectedDomainFieldSubfieldTab2(event.target.value);
  const handleOpenAccessStatusChangeTab2 = event => setSelectedOpenAccessStatusTab2(event.target.value);
  const handleSdgChangeTab2 = event => setSelectedSdgTab2(event.target.value);
  const handleAuthorChangeTab2 = event => setSelectedAuthorTab2(event.target.value);

  // Values to populate the table
  const [authorCollaborationsTab2, setAuthorCollaborationsTab2] = useState([]);

  // Refreshing table when filters are selected
  useEffect(() => {
    fetchData(`/authorCollaborations?${new URLSearchParams({
      id: selectedAuthorTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
    })}`, setAuthorCollaborationsTab2);
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab2, selectedOpenAccessStatusTab2, selectedSdgTab2]);

  // TAB 3

  return (
    <div className="App container-fluid">
      <div className="row">
        <div className="col">
          <div>
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="tab1-tab" data-toggle="tab" href="#tab1" role="tab" aria-controls="tab1" aria-selected="true" onClick={() => handleTabChange('tab1_1')}>University of Milan's Collaborations</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab2-tab" data-toggle="tab" href="#tab2" role="tab" aria-controls="tab2" aria-selected="false" onClick={() => handleTabChange('tab2')}>Author Collaboration</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab3-tab" data-toggle="tab" href="#tab3" role="tab" aria-controls="tab3" aria-selected="false" onClick={() => handleTabChange('tab3')}>Group's Collaborations</a>
              </li>
            </ul>
          </div>
          <div className="tab-content">
            <div className="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
              <div id="unimi_collaborations">
                <h2 className='title'>Collaborations with University of Milan</h2>
                <div className="card">
                  <div className="row justify-content-around">
                    <div>
                      <div className="card-body row justify-content-around">
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <form id="institution_input">
                              <input type="text" value={inputInstitutionTab1} onChange={handleInstitutionChangeTab1} placeholder="Institution" />
                              <ul className='suggestion-list'>
                                {suggestionsInstitutionTab1.map((institution) => (
                                  <li key={institution.id_institution} onClick={() => handleSuggestionClickTab1(institution)}>
                                    {institution.name}
                                  </li>
                                ))}
                              </ul>
                            </form>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <select className="form-select" value={selectedDepartmentTab1} onChange={handleDepartmentChangeTab1}>
                              <option value="">Department</option>
                              {departments.map(department => (
                                <option key={department.id_department} value={department.id_department}>{department.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <select className="form-select" value={selectedDomainFieldSubfieldTab1} onChange={handleDomainFieldSubfieldChangeTab1}>
                              <option value="">Topic</option>
                              {subfields.map(subfield => (
                                <option key={subfield.id_openalex} value={subfield.id_openalex}>{subfield.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <select className="form-select" value={selectedOpenAccessStatusTab1} onChange={handleOpenAccessStatusChangeTab1}>
                              <option value="">Open access status</option>
                              {openAccessStatuses.map(status => (
                                <option key={status.openaccess_status} value={status.openaccess_status}>{status.openaccess_status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <select className="form-select" value={selectedSdgTab1} onChange={handleSdgChangeTab1}>
                              <option value="">Sustainable development goal</option>
                              {sdgs.map(sdg => (
                                <option key={sdg.id_sdg} value={sdg.id_sdg}>{sdg.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <input type="number" id="minYearTab1" name="minYear" onChange={handleStartYearTab1}></input>
                          <input type="number" id="maxYearTab1" name="maxYear" onChange={handleFinishYearTab1}></input>
                        </div>
                      </div>
                    </div>
                    <div className="row justify-content-around">
                      <div id='tab1-left' className="col-md-4">
                        <div id='statistics'>
                          <div className="row g-0 justify-content-around">
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='author_number' className='number'>0</div>
                                <div className='text'>Collaborators</div>
                              </div>
                            </div>
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='country_number' className='number'>0</div>
                                <div className='text'>Countries</div>
                              </div>
                            </div>
                          </div>
                          <div className="row g-0 justify-content-around">
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='institution_number' className='number'>0</div>
                                <div className='text'>Institutions</div>
                              </div>
                            </div>
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='work_number' className='number'>0</div>
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
                                <th><span>Collaboration Count</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(collaborationsByCountryTab1).sort((a, b) => b[1].collabs - a[1].collabs).slice(0, 10).map(([country, data], index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{country}</td>
                                  <td>{data.collabs}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className='row'>
                          <div id='nav-tab1' className='col-md-4'>
                            <ul className="nav nav-tabs" role="tablist">
                              <li className="nav-item">
                                <a className="nav-link active" id="tab1-tab1map" data-toggle="tab" href="#tab1map" role="tab" aria-controls="tab1map" aria-selected="true" onClick={() => handleTabChange('tab1_1')}>Map View</a>
                              </li>
                              <li className="nav-item">
                                <a className="nav-link" id="tab1-tab1list" data-toggle="tab" href="#tab1list" role="tab" aria-controls="tab1list" aria-selected="false" onClick={() => handleTabChange('tab1_2')}>List View</a>
                              </li>
                            </ul>
                          </div>
                          <div className='col-md-8'>
                            <div id="mapLegendTab1" className='legend-container'></div>
                          </div>
                        </div>
                        <div className="tab-content">
                          <div className="tab-pane fade show active" id="tab1map" role="tabpanel" aria-labelledby="tab1-tab1map">
                            <div id="svgMapTab1"></div>
                          </div>
                          <div className="tab-pane fade" id="tab1list" role="tabpanel" aria-labelledby="tab1-tab1list">
                            <div id='list-view'>
                              <div id='table-view' className='row table-container'>
                                <table className="table">
                                  <thead>
                                    <tr>
                                      <th className="clickable" onClick={() => handleSort('institution_name')}>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Institution Name</span>
                                          {sortColumn === 'institution_name' && (
                                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                          )}
                                        </div>
                                      </th>
                                      <th className="clickable" onClick={() => handleSort('country')}>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Country</span>
                                          {sortColumn === 'country' && (
                                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                          )}
                                        </div>
                                      </th>
                                      <th className="clickable" onClick={() => handleSort('collabs')}>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Collaborations</span>
                                          {sortColumn === 'collabs' && (
                                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                          )}
                                        </div>
                                      </th>
                                      <th className="clickable" onClick={() => handleSort('citations')}>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span>Citations</span>
                                          {sortColumn === 'citations' && (
                                            <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                                          )}
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sortedData(Object.entries(collaborationsByInstitutionTab1).map(([institution, data]) => ({
                                      institution_name: institution,
                                      country: data.country,
                                      collabs: data.collabs,
                                      citations: data.citations
                                    }))).map((collaboration, index) => (
                                      <tr key={index}>
                                        <td>{collaboration.institution_name}</td>
                                        <td>{collaboration.country}</td>
                                        <td>{collaboration.collabs}</td>
                                        <td>{collaboration.citations}</td>
                                      </tr>
                                    ))}
                                  </tbody>
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
                <h2 className='title'>Author Collaborations</h2>
                <div className="card mb-3">
                  <div className="card-body row">
                    <div className="col-md-3">
                      <div className="card-text filter">
                        <select className="form-select" value={selectedAuthorTab2} onChange={handleAuthorChangeTab2}>
                          <option value="">Select an author</option>
                          {authors.map(author => (
                            <option key={author.id_author} value={author.id_author}>{author.surname} {author.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text filter">
                        <select className="form-select" value={selectedDomainFieldSubfieldTab2} onChange={handleDomainFieldSubfieldChangeTab2}>
                          <option value="">Select a topic</option>
                          {subfields.map(subfield => (
                            <option key={subfield.id_openalex} value={subfield.id_openalex}>{subfield.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text filter">
                        <select className="form-select" value={selectedOpenAccessStatusTab2} onChange={handleOpenAccessStatusChangeTab2}>
                          <option value="">Select an open access status</option>
                          {openAccessStatuses.map(status => (
                            <option key={status.openaccess_status} value={status.openaccess_status}>{status.openaccess_status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text filter">
                        <select className="form-select" value={selectedSdgTab2} onChange={handleSdgChangeTab2}>
                          <option value="">Select a sustainable development goal</option>
                          {sdgs.map(sdg => (
                            <option key={sdg.id_sdg} value={sdg.id_sdg}>{sdg.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="clickable" onClick={() => handleSort('institution_name')}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Institution Name</span>
                            {sortColumn === 'institution_name' && (
                              <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                            )}
                          </div>
                        </th>
                        <th className="clickable" onClick={() => handleSort('country')}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Country</span>
                            {sortColumn === 'country' && (
                              <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                            )}
                          </div>
                        </th>
                        <th className="clickable" onClick={() => handleSort('collaboration_count')}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Collaboration Count</span>
                            {sortColumn === 'collaboration_count' && (
                              <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData(authorCollaborationsTab2).map((collaboration, index) => (
                        <tr key={index}>
                          <td>{collaboration.institution_name}</td>
                          <td>{collaboration.country}</td>
                          <td>{collaboration.collaboration_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="tab-pane fade" id="tab3" role="tabpanel" aria-labelledby="tab3-tab">
              <div id="group_collaborations">
                <h2 className='title'>Groups's Collaborations</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
