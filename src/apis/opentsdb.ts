import axios from 'axios';

const baseUrl = '/api/opentsdb'

export const OpentsdbApi = {
  getJobs() {
    return axios.get(`${baseUrl}/getJobs`);
  },
  createJob(body: any) {
    return axios.post(`${baseUrl}/createJob`, body);
  },
  startJob(body: any) {
    return axios.post(`${baseUrl}/startJob`, body);
  },
  stopJob(body: any) {
    return axios.post(`${baseUrl}/stopJob`, body);
  },
  deleteJob(body: any) {
    return axios.post(`${baseUrl}/deleteJob`, body);
  },
  getSuggest(body: any) {
    return axios.post(`${baseUrl}/getSuggest`, body);
  },
  getAggregators(body: any) {
    return axios.post(`${baseUrl}/getAggregators`, body);
  },
  getThreadConfig() {
    return axios.get(`${baseUrl}/getThreadConfig`)
  }
}
