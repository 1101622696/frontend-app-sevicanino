import { createApp } from 'vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import App from './App.vue'
import router from './router'
import axios from "axios";
import '@quasar/extras/material-icons/material-icons.css'
import Swal from 'sweetalert2';

axios.defaults.baseURL = "http://localhost:4000/";
// axios.defaults.baseURL = "https://backend-app-canino.onrender.com";

let requestsPending = 0;

axios.interceptors.request.use((request) => {
  requestsPending ++;

if (requestsPending == 1) {
  Swal.fire({
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
    allowEscakey: false,
    allowEnterkey: false,
  });
}
return request;
});

axios.interceptors.response.use(
function (response){
  requestsPending--;

  if (requestsPending == 0){
    Swal.close();
  }
  return response;
},
function (error) {
requestsPending--;
if(requestsPending == 0) {
  Swal.close();
}

// if (error.response.status == 401) {
//  router .push('/')
// }

if (error.response && error.response.status === 401) {
  router.push('/')
}

return Promise.reject(error);
});

const pinia =createPinia()
pinia.use(piniaPluginPersistedstate)
const myApp = createApp(App)
myApp.use(pinia)  
myApp.use(router)
myApp.use(Quasar,  {
  plugins: { Notify },
  config: {
    notify: {
      position: 'top',
      timeout: 2500,
      textColor: 'white',
      actions: [{ icon: 'close', color: 'white' }],
      color:"red"
    },
  },
})


myApp.mount('#app')
