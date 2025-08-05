import axios from 'axios';
import Cookies from 'js-cookie';

// Use relative URLs in production, absolute in development
const baseURL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8000';

const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

// Add response interceptor to handle CSRF token from responses
instance.interceptors.response.use(
    (response) => {
        // Check if response contains CSRF token and set it
        if (response.data && response.data.csrfToken) {
            const token = response.data.csrfToken;
            Cookies.set('csrftoken', token);
            instance.defaults.headers['X-Csrftoken'] = token;
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Check for existing csrftoken
const csrftoken = Cookies.get('csrftoken');
if (csrftoken) {
    instance.defaults.headers['X-Csrftoken'] = csrftoken;
}

export default instance;