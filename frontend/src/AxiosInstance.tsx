import axios from 'axios';
import Cookies from 'js-cookie';

const instance = axios.create({
    baseURL: "http://127.0.0.1:8000",
    withCredentials: true,
});

// Check for csrftoken
const csrftoken = Cookies.get('csrftoken');
if (csrftoken) {
    instance.defaults.headers['X-Csrftoken'] = csrftoken;
}

export default instance;