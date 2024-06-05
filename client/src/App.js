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
  const [institutions, setInstitutions] = useState([]); // da spostare in tab1

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
    fetchData('/institutions', setInstitutions, signal);
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
          document.getElementById('minYearTab2').placeholder = minYear;
          document.getElementById('maxYearTab2').placeholder = maxYear;
          document.getElementById('minYearTab2').min = minYear;
          document.getElementById('maxYearTab2').min = minYear;
          document.getElementById('minYearTab2').max = maxYear;
          document.getElementById('maxYearTab2').max = maxYear;
        })
        .catch(error => console.error(`Error fetching data from years:`, error));
    };
    fetchYears();
    return () => {
      abortControllerRef.current.abort()
    }
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
    //reset filters
  };

  // TAB 1
  // Selected filter values
  const [selectedDepartmentTab1, setSelectedDepartmentTab1] = useState('');
  const [selectedDomainFieldSubfieldTab1, setSelectedDomainFieldSubfieldTab1] = useState('');
  const [selectedOpenAccessStatusTab1, setSelectedOpenAccessStatusTab1] = useState('');
  const [selectedSdgTab1, setSelectedSdgTab1] = useState('');
  const [selectedInstitutionTab1, setSelectedInstitutionTab1] = useState([]);
  const [selectedStartYearTab1, setSelectedStartYearTab1] = useState('2000');
  const [selectedFinishYearTab1, setSelectedFinishYearTab1] = useState('');
  const [inputInstitutionTab1, setInputInstitutionTab1] = useState('');
  const [suggestionsInstitutionTab1, setSuggestionsInstitutionTab1] = useState([]);

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

  // Updating lengend visibility when in tab 1_1
  useEffect(() => {
    if (activeTab === 'tab1_1') {
      document.getElementById('mapLegendTab1').style.display = 'flex';
      updateMapTab1();
    } else {
      document.getElementById('mapLegendTab1').style.display = 'none';
    }
  }, [activeTab]);

  // Values to populate map table and graph
  const [institutionCollaborationsTab1, setInstitutionCollaborationsTab1] = useState([]);
  const [mapCollaborationsTab1, setMapCollaborationsTab1] = useState([]);
  const [yearsCollaborationsTab1, setYearsCollaborationsTab1] = useState([]);
  const [collaboratorsTab1, setCollaboratorsTab1] = useState([]);
  const [collaborationsTab1, setCollaborationsTab1] = useState([]);
  const [collaborationsByCountryTab1, setCollaborationsByCountryTab1] = useState({});
  const [yearsDataTab1, setYearsDataTab1] = useState({});
  const [collaborationsByInstitutionTab1, setCollaborationsByInstitutionTab1] = useState({});

  // Updating values when filters are selected
  useEffect(() => {
    try {
      if (activeTab === 'tab1_1' || activeTab === 'tab1_2') {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const params = new URLSearchParams({
          institution: selectedInstitutionTab1,
          department: selectedDepartmentTab1,
          domainFieldSubfield: selectedDomainFieldSubfieldTab1,
          openAccessStatus: selectedOpenAccessStatusTab1,
          sdg: selectedSdgTab1,
          startYear: selectedStartYearTab1,
          finishYear: selectedFinishYearTab1
        });
        fetchData(`/unimi/countryCollaborations?${params}`, setMapCollaborationsTab1, signal);
        fetchData(`/unimi/collaborators?${params}`, setCollaboratorsTab1, signal);
        fetchData(`/unimi/collaborations?${params}`, setCollaborationsTab1, signal);
        fetchData(`/unimi/institutionCollaborations?${params}`, setInstitutionCollaborationsTab1, signal);
        fetchData(`/unimi/yearsCollaborations?${params}`, setYearsCollaborationsTab1, signal);
        return () => {
          abortControllerRef.current.abort()
        }
      }
    } catch (error) {
    }
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  useEffect(() => {
    try {
      if (activeTab === 'tab1_1' || activeTab === 'tab1_2') {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        fetchData(`/unimi/institutionView?${new URLSearchParams({
          startYear: selectedStartYearTab1
        })}`, setInstitutionCollaborationsTab1, signal);
        return () => {
          abortControllerRef.current.abort()
        }
      }
    } catch (error) {
    }
  }, []);

  // Updating data for the number of institutions
  useEffect(() => {
    try {
      if (activeTab === 'tab1_1' || activeTab === 'tab1_2') {
        if (institutionCollaborationsTab1.length === 0) {
          throw new Error("No institution found");
        }
        const number = document.getElementById('institution_number_tab1');
        if (!number) {
          throw new Error("Element with ID 'institution_number_tab1' not found");
        }
        number.innerHTML = Object.keys(institutionCollaborationsTab1).length;
      }
    } catch (error) {
    }
  }, [institutionCollaborationsTab1]);

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
    number.innerHTML = Object.keys(collaborationsByCountry).length;
    setCollaborationsByCountryTab1(collaborationsByCountry);
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

  // Updating data for University of Milan's collaborators number
  useEffect(() => {
    try {
      if (collaboratorsTab1.length === 0) {
        throw new Error("No author found");
      }
      const number = document.getElementById('author_number_tab1');
      if (!number) {
        throw new Error("Element with ID 'author_number_tab1' not found");
      }
      number.innerHTML = parseInt(collaboratorsTab1[0].total_authors);
    } catch (error) {
    }
  }, [collaboratorsTab1]);

  // Updating data for University of Milan's collaborations number
  useEffect(() => {
    try {
      if (collaborationsTab1.length === 0) {
        throw new Error("No works found");
      }
      const number = document.getElementById('work_number_tab1');
      if (!number) {
        throw new Error("Element with ID 'work_number_tab1' not found");
      }
      number.innerHTML = parseInt(collaborationsTab1[0].total_works);
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
      updateMapTab1();
    }
    setTimeout(() => {
      if (activeTab === 'tab1_1') {
        updateMapTab1();
      }
    }, 500);
  }, [collaborationsByCountryTab1, activeTab]);

  // Instancing the map
  const updateMapTab1 = () => {
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
  const [subfieldsTab2, setDomainFieldSubfieldsTab2] = useState([]);
  const [openAccessStatusesTab2, setOpenAccessStatusesTab2] = useState([]);
  const [sdgsTab2, setSdgsTab2] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [institutionsTab2, setInstitutionsTab2] = useState([]);
  const [collaboratorsTab2, setCollaboratorsTab2] = useState([]);
  const [countriesTab2, setCountriesTab2] = useState([]);

  const [selectedAuthorTab2, setSelectedAuthorTab2] = useState('1');
  const [selectedDepartmentTab2, setSelectedDepartmentTab2] = useState('');
  const [selectedDomainFieldSubfieldTab2, setSelectedDomainFieldSubfieldTab2] = useState('');
  const [selectedOpenAccessStatusTab2, setSelectedOpenAccessStatusTab2] = useState('');
  const [selectedSdgTab2, setSelectedSdgTab2] = useState('');
  const [selectedStartYearTab2, setSelectedStartYearTab2] = useState('2000');
  const [selectedFinishYearTab2, setSelectedFinishYearTab2] = useState('');
  const [selectedInstitutionTab2, setSelectedInstitutionTab2] = useState('');
  const [selectedCollaboratorTab2, setSelectedCollaboratorTab2] = useState('');
  const [selectedCountryTab2, setSelectedCountryTab2] = useState('');

  // Update filter values
  const handleAuthorChangeTab2 = event => setSelectedAuthorTab2(event.target.value);
  const handleDepartmentChangeTab2 = event => setSelectedDepartmentTab2(event.target.value);
  const handleDomainFieldSubfieldChangeTab2 = event => setSelectedDomainFieldSubfieldTab2(event.target.value);
  const handleOpenAccessStatusChangeTab2 = event => setSelectedOpenAccessStatusTab2(event.target.value);
  const handleSdgChangeTab2 = event => setSelectedSdgTab2(event.target.value);
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
  const handleInstitutionChangeTab2 = event => setSelectedInstitutionTab2(event.target.value);
  const handleCollaboratorChangeTab2 = event => setSelectedCollaboratorTab2(event.target.value);
  const handleCountryChangeTab2 = event => setSelectedCountryTab2(event.target.value);

  // Filters requests
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    fetchData(`/author/authors?${new URLSearchParams({ department: selectedDepartmentTab2 })}`, setAuthors, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedDepartmentTab2]);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    fetchData(`/author/domainFieldSubfields?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setDomainFieldSubfieldsTab2, signal);
    fetchData(`/author/openAccessStatuses?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setOpenAccessStatusesTab2, signal);
    fetchData(`/author/sdgs?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setSdgsTab2, signal);
    fetchData(`/author/institutions?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setInstitutionsTab2, signal);
    fetchData(`/author/collaborators?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setCollaboratorsTab2, signal);
    fetchData(`/author/countries?${new URLSearchParams({ id: selectedAuthorTab2 })}`, setCountriesTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2]);

  // Updating legend and select when in tab 2_1
  useEffect(() => {
    try {
      if (activeTab === 'tab2_1') {
        document.getElementById('mapLegendTab2').style.display = 'flex';
        const text = document.getElementById('text_inst_coll');
        if (!text) {
          throw new Error("Element with ID 'text_inst_coll' not found");
        }
        text.innerHTML = 'Institutions';
        const number = document.getElementById('institution_collaborator_tab2');
        if (!number) {
          throw new Error("Element with ID 'institution_collaborator_tab2' not found");
        }
        number.innerHTML = parseInt(institutionCollaborationsTab2[0].institution_count);
        const select = document.getElementById('select_instcoll_tab2');
        if (!select) {
          throw new Error("Element with ID 'select_country_tab2' not found");
        }
        select.value = selectedInstitutionTab2;
        select.onchange = handleInstitutionChangeTab2;
        select.innerHTML = '<option value="">Institution</option>';
        institutionsTab2.map(institution => (
          select.innerHTML += '<option key="' + institution.id_institution + '" value="' + institution.id_institution + '">' + institution.name + '</option>'
        ));
        setSelectedCollaboratorTab2('');
      } else {
        document.getElementById('mapLegendTab2').style.display = 'none';
      }
    } catch (error) {
    }
  }, [activeTab]);

  // Updating select when in tab 2_2
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
        number.innerHTML = parseInt(collaboratorsNumberTab2[0].author_count);
        const select = document.getElementById('select_instcoll_tab2');
        if (!select) {
          throw new Error("Element with ID 'select_country_tab2' not found");
        }
        select.value = selectedCollaboratorTab2;
        select.onchange = handleCollaboratorChangeTab2;
        select.innerHTML = '<option value="">Collaborator</option>';
        collaboratorsTab2.map(collaborator => (
          select.innerHTML += '<option key="' + collaborator.id_author + '" value="' + collaborator.id_author + '">' + collaborator.surname + ' ' + collaborator.name + '</option>'
        ));
        setSelectedInstitutionTab2('');
      }
    } catch (error) {
    }
  }, [activeTab]);

  // Values to populate the tab
  const [collaborationsByCountryTab2, setCollaborationsByCountryTab2] = useState([]); //mappa 1
  const [collaboratorsByCountryTab2, setCollaboratorsByCountryTab2] = useState([]); // mappa 2
  const [collaborationsTab2, setCollaborationsTab2] = useState([]); // numero tot
  const [institutionCollaborationsTab2, setInstitutionCollaborationsTab2] = useState([]); // numero 1
  const [collaboratorsNumberTab2, setCollaboratorsNumberTab2] = useState([]); // numero 2
  const [countryInstitutionsTab2, setCountryInstitutionsTab2] = useState([]); // tabella 1
  const [countryCollaboratorsTab2, setCountryCollaboratorsTab2] = useState([]); // tabella 2

  const [mapInstitutionsTab2, setMapInstitutionsTab2] = useState([]); //mappa 1
  const [mapCollaboratorsTab2, setMapCollaboratorsTab2] = useState([]); //mappa 2

  // Updating values for institutions map when filters are selected
  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    fetchData(`/author/countryCollaborations?${params}`, setCollaborationsByCountryTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      institution: selectedInstitutionTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    fetchData(`/author/institutionsCollaborations?${params}`, setInstitutionCollaborationsTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1, selectedInstitutionTab2]);

  // Updating values for collaborators map when filters are selected
  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    fetchData(`/author/countryCollaborators?${params}`, setCollaboratorsByCountryTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1]);

  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    const params = new URLSearchParams({
      id: selectedAuthorTab2,
      collaborator: selectedCollaboratorTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    });
    fetchData(`/author/collaboratorsCollaborations?${params}`, setCollaboratorsNumberTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1, selectedCollaboratorTab2]);

  // Updating total number of collaborations of an author
  useEffect(() => {
    const signal = abortControllerRef.current.signal;
    fetchData(`/author/collaborations?${new URLSearchParams({
      id: selectedAuthorTab2,
      institution: selectedInstitutionTab2,
      collaborator: selectedCollaboratorTab2,
      domainFieldSubfield: selectedDomainFieldSubfieldTab2,
      openAccessStatus: selectedOpenAccessStatusTab2,
      sdg: selectedSdgTab2,
      startYear: selectedStartYearTab2,
      finishYear: selectedFinishYearTab2
    })}`, setCollaborationsTab2, signal);
    return () => {
      abortControllerRef.current.abort()
    }
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1, selectedStartYearTab1, selectedFinishYearTab1, selectedInstitutionTab2, selectedCollaboratorTab2]);

  // Updating the institutions and collaborators collaborating with an author of a country
  useEffect(() => {
    try {
      if (activeTab === 'tab2_1' || activeTab === 'tab2_2') {
        const signal = abortControllerRef.current.signal;

        fetchData(`/author/institutionsCountry?${new URLSearchParams({
          id: selectedAuthorTab2,
          institution: selectedInstitutionTab2,
          domainFieldSubfield: selectedDomainFieldSubfieldTab2,
          openAccessStatus: selectedOpenAccessStatusTab2,
          sdg: selectedSdgTab2,
          startYear: selectedStartYearTab2,
          finishYear: selectedFinishYearTab2,
          country: selectedCountryTab2
        })}`, setCountryInstitutionsTab2, signal);

        fetchData(`/author/collaboratorsCountry?${new URLSearchParams({
          id: selectedAuthorTab2,
          collaborator: selectedCollaboratorTab2,
          domainFieldSubfield: selectedDomainFieldSubfieldTab2,
          openAccessStatus: selectedOpenAccessStatusTab2,
          sdg: selectedSdgTab2,
          startYear: selectedStartYearTab2,
          finishYear: selectedFinishYearTab2,
          country: selectedCountryTab2
        })}`, setCountryCollaboratorsTab2, signal);
        return () => {
          abortControllerRef.current.abort()
        }
      }
    } catch (error) {
    }
  }, [selectedCountryTab2]);

  // Updating data for the institutions map
  useEffect(() => {
    const collaborationsByCountry = {};
    collaborationsByCountryTab2.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaboration_count);
      if (!isNaN(count)) {
        collaborationsByCountry[country] = { collabs: count };
      }
    });
    setMapInstitutionsTab2(collaborationsByCountry);
  }, [collaborationsByCountryTab2]);

  // Updating data for the collaborators map
  useEffect(() => {
    const collaboratorsByCountry = {};
    collaboratorsByCountryTab2.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaborator_count);
      if (!isNaN(count)) {
        collaboratorsByCountry[country] = { collabs: count };
      }
    });
    setMapCollaboratorsTab2(collaboratorsByCountry);
  }, [collaboratorsByCountryTab2]);

  // Updating data for the number of collaborations
  useEffect(() => {
    try {
      if (collaborationsTab2.length === 0) {
        throw new Error("No works found");
      }
      document.getElementById('work_number_tab2').innerHTML = parseInt(collaborationsTab2[0].total_works);
    } catch (error) {
    }
  }, [collaborationsTab2]);

  // Updating data for the number of institutions
  useEffect(() => {
    if (activeTab === 'tab2_1') {
      try {
        if (institutionCollaborationsTab2.length === 0) {
          throw new Error("No institution found");
        }
        document.getElementById('institution_collaborator_tab2').innerHTML = parseInt(institutionCollaborationsTab2[0].institution_count);
      } catch (error) {
      }
    }
  }, [institutionCollaborationsTab2]);

  // Updating data for the number of collaborators
  useEffect(() => {
    if (activeTab === 'tab2_1') {
      try {
        if (collaboratorsNumberTab2.length === 0) {
          throw new Error("No author found");
        }
        document.getElementById('institution_collaborator_tab2').innerHTML = parseInt(collaboratorsNumberTab2[0].author_count);
      } catch (error) {
      }
    }
  }, [collaboratorsNumberTab2]);

  // Updating author when switching department
  useEffect(() => {
    console.log(authors);
    var select = document.getElementById('select_author_tab2');
    select.innerHTML = '';
    select.value = selectedAuthorTab2;
    select.onchange = handleAuthorChangeTab2;
    authors.map(author => (
      select.innerHTML += `<option key=${author.id_author} value=${author.id_author}>${author.surname} ${author.name}</option>`
    ))
  }, [authors]);

  // Update filters when switching author
  useEffect(() => {
    var select = document.getElementById('select_dfs_tab2');
    select.value = selectedDomainFieldSubfieldTab2;
    select.onchange = handleDomainFieldSubfieldChangeTab2;
    select.innerHTML = '<option value="">Topic</option>';
    subfieldsTab2.map(subfield => (
      select.innerHTML += `<option key=${subfield.id} value=${subfield.id}>${subfield.name}</option>`
    ));
  }, [subfieldsTab2]);

  useEffect(() => {
    var select = document.getElementById('select_oa_tab2');
    select.value = selectedOpenAccessStatusTab2;
    select.onchange = handleOpenAccessStatusChangeTab2;
    select.innerHTML = '<option value="">Open Access Status</option>';
    openAccessStatusesTab2.map(status => (
      select.innerHTML += `<option key='${status.openaccess_status}' value='${status.openaccess_status}'>${status.openaccess_status}</option>`
    ));
  }, [openAccessStatusesTab2]);

  useEffect(() => {
    var select = document.getElementById('select_sdg_tab2');
    select.value = selectedSdgTab2;
    select.onchange = handleSdgChangeTab2;
    select.innerHTML = '<option value="">Sustainable Development Goals</option>';
    sdgsTab2.map(sdg => (
      select.innerHTML += `<option key=${sdg.id} value=${sdg.id}>${sdg.name}</option>`
    ));
  }, [sdgsTab2]);

  // Updating country filter
  useEffect(() => {
    var select = document.getElementById('select_country_tab2');
    select.value = selectedCountryTab2;
    select.onchange = handleCountryChangeTab2;
    select.innerHTML = '<option value="">Country</option>';
    countriesTab2.map(country => (
      select.innerHTML += '<option key="' + country.country_code + '" value="' + country.country_code + '">' + country.country_code + '</option>'
    ));
  }, [countriesTab2]);

  // Updating data for the institutions table
  useEffect(() => {
    if (activeTab === 'tab2_1') {
      const table = document.getElementById('inst-coll-table');
      table.innerHTML = `
      <thead>
        <tr>
          <th><span>Institution</span></th>
          <th><span>Collaborations</span></th>
        </tr>
      </thead>`;
      countryInstitutionsTab2.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.institution_name}</td>
          <td>${row.collaboration_count}</td>
        `;
        table.appendChild(tr);
      });
    }
  }, [countryInstitutionsTab2, activeTab]);

  // Updating data for the collaborators table
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      const table = document.getElementById('inst-coll-table');
      table.innerHTML = `
      <thead>
        <tr>
          <th><span>Collaborator</span></th>
          <th><span>Collaborations</span></th>
        </tr>
      </thead>`;
      countryCollaboratorsTab2.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.name} ${row.surname}</td>
          <td>${row.collaboration_count}</td>
        `;
        table.appendChild(tr);
      });
    }
  }, [countryCollaboratorsTab2, activeTab]);

  // Updating collaborations map
  useEffect(() => {
    if (activeTab === 'tab2_1') {
      updateMap1Tab2();
    }
    setTimeout(() => {
      if (activeTab === 'tab2_1') {
        updateMap1Tab2();
      }
    }, 500);
  }, [mapInstitutionsTab2, activeTab]);

  // Updating collaborators map
  useEffect(() => {
    if (activeTab === 'tab2_2') {
      updateMap2Tab2();
    }
    setTimeout(() => {
      if (activeTab === 'tab2_2') {
        updateMap2Tab2();
      }
    }, 500);
  }, [mapCollaboratorsTab2, activeTab]);

  // Instancing collaborations map
  const updateMap1Tab2 = () => {
    try {
      if (activeTab === 'tab2_1') {
        const mapContainer = document.getElementById('svgMap1Tab2');
        if (!mapContainer) {
          throw new Error("Element with ID 'svgMap1Tab2' not found");
        }
        mapContainer.innerHTML = '';
        const map = new svgMap({
          targetElementID: 'svgMap1Tab2',
          data: {
            data: {
              collabs: {
                name: 'Number of collaborations',
                format: '{0}',
                thousandSeparator: '\''
              }
            },
            applyData: 'collabs',
            values: mapInstitutionsTab2
          }
        });

        var maxValue = 0;
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

  // Instancing collaborations map // TODO
  const updateMap2Tab2 = () => {
    try {
      if (activeTab === 'tab2_2') {
        const mapContainer = document.getElementById('svgMap2Tab2');
        if (!mapContainer) {
          throw new Error("Element with ID 'svgMap2Tab2' not found");
        }
        mapContainer.innerHTML = '';
        new svgMap({
          targetElementID: 'svgMap2Tab2',
          data: {
            data: {
              collabs: {
                name: 'Number of collaborations',
                format: '{0}',
                thousandSeparator: '\''
              }
            },
            applyData: 'collabs',
            values: mapCollaboratorsTab2
          }
        });
      }
    } catch (error) {
    }
  };

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
                <a className="nav-link" id="tab2-tab" data-toggle="tab" href="#tab2" role="tab" aria-controls="tab2" aria-selected="false" onClick={() => handleTabChange('tab2_1')}>Author Collaboration</a>
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
                    <div className="row justify-content-around">
                      <div id='tab1-left' className="col-md-4">
                        <div id='statTab1'>
                          <div className="row g-0 justify-content-around">
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='author_number_tab1' className='number'>0</div>
                                <div className='text'>Collaborators</div>
                              </div>
                            </div>
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='country_number_tab1' className='number'>0</div>
                                <div className='text'>Countries</div>
                              </div>
                            </div>
                          </div>
                          <div className="row g-0 justify-content-around">
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='institution_number_tab1' className='number'>0</div>
                                <div className='text'>Institutions</div>
                              </div>
                            </div>
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='work_number_tab1' className='number'>0</div>
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
                <div className="card">
                  <div className="row justify-content-around">
                    <div className="card-body row justify-content-around">
                      <div className="col-md-2">
                        <div className="card-text filter">
                          <select className="form-select" value={selectedDepartmentTab2} onChange={handleDepartmentChangeTab2}>
                            <option value="">Department</option>
                            {departments.map(department => (
                              <option key={department.id_department} value={department.id_department}>{department.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="card-text filter">
                          <select id='select_author_tab2' className="form-select"></select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="card-text filter">
                          <select id='select_dfs_tab2' className="form-select"></select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="card-text filter">
                          <select id='select_oa_tab2' className="form-select"></select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="card-text filter">
                          <select id='select_sdg_tab2' className="form-select"></select>
                        </div>
                      </div>
                      <div className="col-md-2">
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
                                <select id='select_instcoll_tab2' className="form-select"></select>
                              </div>
                            </div>
                          </div>
                          <div className="row g-0 justify-content-around">
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='work_number_tab2' className='number'>0</div>
                                <div className='text'>Collaborations</div>
                              </div>
                            </div>
                            <div className='col-md-5'>
                              <div className="number-box">
                                <div id='institution_collaborator_tab2' className='number'>0</div>
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
                            <div id="svgMap1Tab2"></div>
                          </div>
                          <div className="tab-pane fade" id="tab2coll" role="tabpanel" aria-labelledby="tab2-tab2coll">
                            <div id="svgMap2Tab2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
