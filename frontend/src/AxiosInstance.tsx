import axios from 'axios';
import Cookies from 'js-cookie';

// Use relative URLs in production, absolute in development
const baseURL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8000';

const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

// Check for csrftoken
const csrftoken = Cookies.get('csrftoken');
if (csrftoken) {
    instance.defaults.headers['X-Csrftoken'] = csrftoken;
}

export default instance;