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

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filters requests
  useEffect(() => {
    fetchData('/departments', setDepartments);
    fetchData('/domainFieldSubfields', setDomainFieldSubfields);
    fetchData('/openAccessStatuses', setOpenAccessStatuses);
    fetchData('/sdgs', setSdgs);
    fetchData('/authors', setAuthors);
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

  // Update filter values
  const handleDepartmentChangeTab1 = event => setSelectedDepartmentTab1(event.target.value);
  const handleDomainFieldSubfieldChangeTab1 = event => setSelectedDomainFieldSubfieldTab1(event.target.value);
  const handleOpenAccessStatusChangeTab1 = event => setSelectedOpenAccessStatusTab1(event.target.value);
  const handleSdgChangeTab1 = event => setSelectedSdgTab1(event.target.value);

  // Values to populate the map
  const [countryCollaborationsTab1, setCountryCollaborationsTab1] = useState([]);
  const [collaborationsByCountryTab1, setCollaborationsByCountryTab1] = useState({});

  // Refreshing map when filters are selected
  useEffect(() => {
    handleCountrySubmitTab1();
  }, [selectedDepartmentTab1, selectedDomainFieldSubfieldTab1, selectedOpenAccessStatusTab1, selectedSdgTab1]);

  // Request for the new values to update the map
  const handleCountrySubmitTab1 = () => fetchData(`/countryCollaborationsNumber?${new URLSearchParams({
    department: selectedDepartmentTab1,
    domainFieldSubfield: selectedDomainFieldSubfieldTab1,
    openAccessStatus: selectedOpenAccessStatusTab1,
    sdg: selectedSdgTab1,
  })}`, setCountryCollaborationsTab1);

  // Populating values for the map
  useEffect(() => {
    const collaborationsData = {};
    countryCollaborationsTab1.forEach(collaboration => {
      const country = collaboration.country;
      const count = parseInt(collaboration.collaboration_count);
      if (!isNaN(count)) {
        collaborationsData[country] = { collabs: count };
      }
    });
    setCollaborationsByCountryTab1(collaborationsData);
  }, [countryCollaborationsTab1]);

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
    handleAuthorSubmitTab2();
  }, [selectedAuthorTab2, selectedDomainFieldSubfieldTab2, selectedOpenAccessStatusTab2, selectedSdgTab2]);

  // Request for the new values to update the table
  const handleAuthorSubmitTab2 = () => fetchData(`/authorCollaborations?${new URLSearchParams({
    id: selectedAuthorTab2,
    domainFieldSubfield: selectedDomainFieldSubfieldTab2,
    openAccessStatus: selectedOpenAccessStatusTab2,
    sdg: selectedSdgTab2,
  })}`, setAuthorCollaborationsTab2);

  // TAB 3
  // Filters Values
  const [selectedDepartmentTab3, setSelectedDepartmentTab3] = useState('');
  const [selectedDomainFieldSubfieldTab3, setSelectedDomainFieldSubfieldTab3] = useState('');
  const [selectedOpenAccessStatusTab3, setSelectedOpenAccessStatusTab3] = useState('');
  const [selectedSdgTab3, setSelectedSdgTab3] = useState('');

  // Update filter values
  const handleDepartmentChangeTab3 = event => setSelectedDepartmentTab3(event.target.value);
  const handleDomainFieldSubfieldChangeTab3 = event => setSelectedDomainFieldSubfieldTab3(event.target.value);
  const handleOpenAccessStatusChangeTab3 = event => setSelectedOpenAccessStatusTab3(event.target.value);
  const handleSdgChangeTab3 = event => setSelectedSdgTab3(event.target.value);

  // Values to populate the table
  const [institutionCollaborationsTab3, setInstitutionCollaborationsTab3] = useState([]);

  // Refreshing table when filters are selected
  useEffect(() => {
    handleInstitutionSubmitTab3();
  }, [selectedDepartmentTab3, selectedDomainFieldSubfieldTab3, selectedOpenAccessStatusTab3, selectedSdgTab3]);

  // Request for the new values to update the table
  const handleInstitutionSubmitTab3 = () => fetchData(`/institutionCollaborations?${new URLSearchParams({
    department: selectedDepartmentTab3,
    domainFieldSubfield: selectedDomainFieldSubfieldTab3,
    openAccessStatus: selectedOpenAccessStatusTab3,
    sdg: selectedSdgTab3,
  })}`, setInstitutionCollaborationsTab3);

  return (
    <div className="App container-fluid">
      <div className="row">
        <div className="col">
          <div id="navbar">
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="tab1-tab" data-toggle="tab" href="#tab1" role="tab" aria-controls="tab1" aria-selected="true" onClick={handleTabChange}>Country Collaborations</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab2-tab" data-toggle="tab" href="#tab2" role="tab" aria-controls="tab2" aria-selected="false" onClick={handleTabChange}>Author Collaboration</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab3-tab" data-toggle="tab" href="#tab3" role="tab" aria-controls="tab3" aria-selected="false" onClick={handleTabChange}>University of Milan's Collaborations</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="tab4-tab" data-toggle="tab" href="#tab4" role="tab" aria-controls="tab4" aria-selected="false" onClick={handleTabChange}>Group Collaborations</a>
              </li>
            </ul>
          </div>
          <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="tab1" role="tabpanel" aria-labelledby="tab1-tab">
              <div id="country_collaborations">
                <h2>Collaborations with University of Milan</h2>
                <div className="card mb-3">
                  <div className="row g-0 justify-content-around">
                    <div className="card mb-3">
                      <div className="card-body row">
                        <div className="col-md-3">
                          <div className="card-text select">
                            <select className="form-select" value={selectedDepartmentTab1} onChange={handleDepartmentChangeTab1}>
                              <option value="">Select a department</option>
                              {departments.map(department => (
                                <option key={department.id_department} value={department.id_department}>{department.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card-text select">
                            <select className="form-select" value={selectedDomainFieldSubfieldTab1} onChange={handleDomainFieldSubfieldChangeTab1}>
                              <option value="">Select a topic</option>
                              {subfields.map(subfield => (
                                <option key={subfield.id_openalex} value={subfield.id_openalex}>{subfield.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card-text select">
                            <select className="form-select" value={selectedOpenAccessStatusTab1} onChange={handleOpenAccessStatusChangeTab1}>
                              <option value="">Select an open access status</option>
                              {openAccessStatuses.map(status => (
                                <option key={status.openaccess_status} value={status.openaccess_status}>{status.openaccess_status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card-text select">
                            <select className="form-select" value={selectedSdgTab1} onChange={handleSdgChangeTab1}>
                              <option value="">Select a sustainable development goal</option>
                              {sdgs.map(sdg => (
                                <option key={sdg.id_sdg} value={sdg.id_sdg}>{sdg.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id='tab1_left' className="col-md-2">
                      <div id="country_institution_tab1">
                        tabella delle istituzioni della nazione selezionata
                      </div>
                    </div>
                    <div className="col-md-9">
                      <div id="svgMapTab1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tab-pane fade" id="tab2" role="tabpanel" aria-labelledby="tab2-tab">
              <div id="author_collaborations">
                <h2>Author Collaborations</h2>
                <div className="card mb-3">
                  <div className="card-body row">
                    <div className="col-md-3">
                      <div className="card-text select">
                        <select className="form-select" value={selectedAuthorTab2} onChange={handleAuthorChangeTab2}>
                          <option value="">Select an author</option>
                          {authors.map(author => (
                            <option key={author.id_author} value={author.id_author}>{author.surname} {author.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text select">
                        <select className="form-select" value={selectedDomainFieldSubfieldTab2} onChange={handleDomainFieldSubfieldChangeTab2}>
                          <option value="">Select a topic</option>
                          {subfields.map(subfield => (
                            <option key={subfield.id_openalex} value={subfield.id_openalex}>{subfield.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text select">
                        <select className="form-select" value={selectedOpenAccessStatusTab2} onChange={handleOpenAccessStatusChangeTab2}>
                          <option value="">Select an open access status</option>
                          {openAccessStatuses.map(status => (
                            <option key={status.openaccess_status} value={status.openaccess_status}>{status.openaccess_status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card-text select">
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
              <div id="institution_collaborations">
                <h2>University of Milan's Collaborations</h2>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="card-text select">
                          <select className="form-select" value={selectedDepartmentTab3} onChange={handleDepartmentChangeTab3}>
                            <option value="">Select a department</option>
                            {departments.map(department => (
                              <option key={department.id_department} value={department.id_department}>{department.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card-text select">
                          <select className="form-select" value={selectedDomainFieldSubfieldTab3} onChange={handleDomainFieldSubfieldChangeTab3}>
                            <option value="">Select a topic</option>
                            {subfields.map(subfield => (
                              <option key={subfield.id_openalex} value={subfield.id_openalex}>{subfield.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card-text select">
                          <select className="form-select" value={selectedOpenAccessStatusTab3} onChange={handleOpenAccessStatusChangeTab3}>
                            <option value="">Select an open access status</option>
                            {openAccessStatuses.map(status => (
                              <option key={status.openaccess_status} value={status.openaccess_status}>{status.openaccess_status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card-text select">
                          <select className="form-select" value={selectedSdgTab3} onChange={handleSdgChangeTab3}>
                            <option value="">Select a sustainable development goal</option>
                            {sdgs.map(sdg => (
                              <option key={sdg.id_sdg} value={sdg.id_sdg}>{sdg.name}</option>
                            ))}
                          </select>
                        </div>
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
                      {sortedData(institutionCollaborationsTab3).map((collaboration, index) => (
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
            <div className="tab-pane fade" id="tab4" role="tabpanel" aria-labelledby="tab4-tab">
              <div id="group_collaborations">
                <h2>Groups's Collaborations</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
