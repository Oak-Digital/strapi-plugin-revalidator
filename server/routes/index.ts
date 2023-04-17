import headRoutes from './head';
import headTypeRoutes from './head-type';

export default {
  'admin': {
    type: 'admin',
    routes: [
      ...headRoutes,
      ...headTypeRoutes,
    ],
  }
};
