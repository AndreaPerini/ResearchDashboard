import React, { useState, useEffect } from 'react';
import './App.css';
import svgMap from 'svgmap';
import 'svgmap/dist/svgMap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_BASE_URL = 'http://localhost:3000';

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

  // Filters requests
  useEffect(() => {
    fetchData('/departments', setDepartments);
    fetchData('/domainFieldSubfields', setDomainFieldSubfields);
    fetchData('/openAccessStatuses', setOpenAccessStatuses);
    fetchData('/sdgs', setSdgs);
    fetchData('/authors', setAuthors);
    fetchData('/institutions', setInstitutions);
  }, []);

  // Request for a resource
  const fetchData = (endpoint, setter) => {
    fetch(API_BASE_URL + endpoint)
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
      if (sortColumn === 'collaboration_count') {
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

  // Resetting sorting when switching tab
  const handleTabChange = () => {
    setSortColumn(null);
    setSortDirection('asc');
  };

  // TAB 1
  // Filters Values
  const [selectedDepartmentTab1, setSelectedDepartmentTab1] = useState('');
  const [selectedDomainFieldSubfieldTab1, setSelectedDomainFieldSubfieldTab1] = useState('');
  const [selectedOpenAccessStatusTab1, setSelectedOpenAccessStatusTab1] = useState('');
  const [selectedSdgTab1, setSelectedSdgTab1] = useState('');
  const [selectedInstitutionTab1, setSelectedInstitutionTab1] = useState([]);

  const [inputInstitutionTab1, setInputInstitutionTab1] = useState('');
  const [suggestionsInstitutionTab1, setSuggestionsInstitutionTab1] = useState([]);

  // Update filter values
  const handleDepartmentChangeTab1 = event => setSelectedDepartmentTab1(event.target.value);
  const handleDomainFieldSubfieldChangeTab1 = event => setSelectedDomainFieldSubfieldTab1(event.target.value);
  const handleOpenAccessStatusChangeTab1 = event => setSelectedOpenAccessStatusTab1(event.target.value);
  const handleSdgChangeTab1 = event => setSelectedSdgTab1(event.target.value);

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
  const [unimiCollaborationsTab1, setUnimiCollaborationsTab1] = useState([]);
  const [collaborationsByCountryTab1, setCollaborationsByCountryTab1] = useState({});

  // Refreshing map when filters are selected
  useEffect(() => {
    fetchData(`/institutionCollaborations?${new URLSearchParams({
      institution: selectedInstitutionTab1,
      department: selectedDepartmentTab1,
      domainFieldSubfield: selectedDomainFieldSubfieldTab1,
      openAccessStatus: selectedOpenAccessStatusTab1,
      sdg: selectedSdgTab1,
    })}`, setUnimiCollaborationsTab1)
  }, [selectedInstitutionTab1, selectedDepartmentTab1, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1]);

  // Updating data for map and stats
  useEffect(() => {
    const collaborationsData = {};
    var authorNumber = 0;
    var countryNumber = 0;
    var workNumber = 0;

    unimiCollaborationsTab1.forEach(row => {
      const country = row.country;
      const count = parseInt(row.collaboration_count);
      if (!isNaN(count)) {
        if (collaborationsData[country]) {
          collaborationsData[country].collabs += count;
        } else {
          collaborationsData[country] = { collabs: count };
          countryNumber++;
        }
        workNumber += count;
      }
      const authors = parseInt(row.author_count);
      if (!isNaN(authors)) {
        authorNumber += authors;
      }
    });

    document.getElementById('author_number').innerHTML = authorNumber;
    document.getElementById('country_number').innerHTML = countryNumber;
    document.getElementById('institution_number').innerHTML = unimiCollaborationsTab1.length;
    document.getElementById('work_number').innerHTML = workNumber;
    setCollaborationsByCountryTab1(collaborationsData);
  }, [unimiCollaborationsTab1]);

  // Instancing the map
  useEffect(() => {
    if (Object.keys(collaborationsByCountryTab1).length > 0) {
      const mapContainer = document.getElementById('svgMapTab1');
      mapContainer.innerHTML = '';
      new svgMap({
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
    }
  }, [collaborationsByCountryTab1]);

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
  // Filters Values


  // Update filter values


  // Values to populate the table


  // Refreshing table when filters are selected


  return (
    <div className="App container-fluid">
      <div className="row">
        <div className="col">
          <div id="navbar">
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="tab1-tab" data-toggle="tab" href="#tab1" role="tab" aria-controls="tab1" aria-selected="true" onClick={handleTabChange}>University of Milan's Collaborations</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab2-tab" data-toggle="tab" href="#tab2" role="tab" aria-controls="tab2" aria-selected="false" onClick={handleTabChange}>Author Collaboration</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab3-tab" data-toggle="tab" href="#tab3" role="tab" aria-controls="tab3" aria-selected="false" onClick={handleTabChange}>Group's Collaborations</a>
              </li>
            </ul>
          </div>
          <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
              <div id="unimi_collaborations">
                <h2 className='title'>Collaborations with University of Milan</h2>
                <div className="card">
                  <div className="row g-0 justify-content-around">
                    <div className="card mb-3">
                      <div className="card-body row justify-content-around">
                        <div className="col-md-2">
                          <div className="card-text filter">
                            <form id="institution_input">
                              <input type="text" value={inputInstitutionTab1} onChange={handleInstitutionChangeTab1} placeholder="Institution" />
                              <ul>
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
                      </div>
                    </div>
                    <div className="row g-0 justify-content-around">
                      <div id='statistics' className="col-md-3">
                        <div class="number-box">
                          <div id='author_number' className='number'></div>
                          <div className='text'>Collaborating authors</div>
                        </div>
                        <div class="number-box">
                          <div id='country_number' className='number'></div>
                          <div className='text'>Countries</div>
                        </div>
                        <div class="number-box">
                          <div id='institution_number' className='number'></div>
                          <div className='text'>Institutions</div>
                        </div>
                        <div class="number-box">
                          <div id='work_number' className='number'></div>
                          <div className='text'>Works</div>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div id="svgMapTab1"></div>
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
