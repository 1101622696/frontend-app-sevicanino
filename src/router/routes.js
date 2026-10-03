import LoginPage from '../pages/LoginPage.vue';
import Home from '../layouts/MainLayout.vue'; 

const routes = [
  { 
    path: '/', 
    component: LoginPage 
  },
  { 
    path: '/IndexPage', 
    component: Home,
    children: [
      { path: '', component: () => import('../pages/HomePage.vue') },
      { 
        path: 'HomePage', 
        name: 'HomePage', 
        component: () => import('../pages/HomePage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] } 
      },
      { 
        path: 'Caninos', 
        name: 'CaninosPage', 
        component: () => import('../pages/CaninosPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Actividades', 
        name: 'ActividadesPage', 
        component: () => import('../pages/ActividadesPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Vacunacion', 
        name: 'VacunacionPage', 
        component: () => import('../pages/VacunacionPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Profilaxis', 
        name: 'ProfilaxisPage', 
        component: () => import('../pages/ProfilaxisPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Revisiones', 
        name: 'RevisionesPage', 
        component: () => import('../pages/RevisionesPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Tratamientos', 
        name: 'TratamientosPage', 
        component: () => import('../pages/TratamientosPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Alimentacion', 
        name: 'AlimentacionPage', 
        component: () => import('../pages/AlimentacionPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Siniestros', 
        name: 'SiniestrosPage', 
        component: () => import('../pages/SiniestrosPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Chequeos', 
        name: 'ChequeosPage', 
        component: () => import('../pages/ChequeosPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },      
      { 
        path: 'Usuarios', 
        name: 'UsuariosPage', 
        component: () => import('../pages/UsuariosPage.vue'),
        meta: { perfiles: ['administrador', 'manejador'] }
      },
      { 
        path: 'Ciudades', 
        name: 'CiudadesPage', 
        component: () => import('../pages/CiudadesPage.vue'),
        meta: { perfiles: ['administrador'] }
      },
    ]
  },
  // Ruta para manejar rutas no encontradas
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
];


export default routes;