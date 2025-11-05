
import {createRouter, createWebHistory} from "vue-router"

const routes=[
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/face-login',
        name: 'FaceLogin',
        component: () => import('../components/FaceLogin.vue')
    },
    {
        path: '/face-bind',
        name: 'FaceBind',
        component: () => import('../components/FaceBind.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../components/Login.vue'),
    },
    {
        path: '/adminfront',
        name: 'Adminfront',
        component: () => import('../components/AdminFront.vue')
    },
    {
        path: '/readerfront',
        name: 'Readerfront',
        component: () => import('../components/ReaderFront.vue')
    },
    
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../components/Admin.vue'),
        children: [
            {
                path: 'datas',
                name: 'Datas',
                component: () => import('../views/Data.vue')
            },
            {
                path: 'graph',
                name: 'KnowledgeGraph',
                component: () => import('../views/KnowledgeGraph.vue')
            },
            {
                path: 'reviews',
                name: 'Reviews',
                component: () => import('../views/Review.vue'),
            },
            {
                path: 'books/book',
                name: 'Books',
                component: () => import('../views/Book.vue')
            },
            {
                path: 'books/borrow',
                name: 'Borrows',
                component: () => import('../views/Borrow.vue')
            },
            {
                path: 'books/return',
                name: 'Returns',
                component: () => import('../views/Return.vue')
            },
            {
                path: 'readers',
                name: 'Readers',
                component: () => import('../views/Reader.vue')
            },
            
            {
                path: 'aviolations',
                name: 'Aviolations',
                component: () => import('../views/Aviolation.vue')
            },
            {
                path: 'notices',
                name: 'Notices',
                component: () => import('../views/AdminNotice.vue')
            },
            {
                path: 'apersonalcenters',
                name: 'Apersonalcenters',
                component: () => import('../views/APersonalCenter.vue')
            },
            {
                path: 'datas',
                name: 'Datas',
                component: () => import('../views/Data.vue')
            },
            {
                path: 'knowledge',
                name: 'Knowledge',
                component: () => import('../views/Knowledge.vue')
            },
            {
                path: 'chat',
                name: 'Chat',
                component: () => import('../components/ChatBot.vue')
            }
            
        ],
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/reader',
        name: 'Reader',
        component: () => import('../components/Reader.vue'),
        children:[ //子路由表
          {
                path: 'rpersonalcenter', 
                name: 'Rpersonalcenter',
                component: () => import('../views/RPersonalCenter.vue')
            },
            {
                path: 'bookborrow', // 子路由路径，访问时为 /bookborrow
                name: 'Bookborrow',
                component: () => import('../views/BookBorrow.vue')
            },
            {
                path: 'bookreturn', 
                name: 'Bookreturn',
                component: () => import('../views/BookReturn.vue')
            },
            {
                path: 'rviolation', 
                name: 'Rviolation',
                component: () => import('../views/Rviolation.vue')
            },
            {
                path: 'topn',
                name: 'Topn',
                component: () => import('../components/Topn.vue')
            },
            {
                path: 'collect',
                name: 'Collect',
                component: () => import('../components/Collect.vue')
            },
            {
                path: '/books/:bookId',
                name: 'BookDetail',
                component: () => import('../components/BookDetail.vue'),
            },
            {
                path: 'donate',
                name: 'Donate',
                component: () => import('../components/Donate.vue')
            },
            {
                path: 'readernotice', 
                name: 'Readernotice',
                component: () => import('../views/ReaderNotice.vue')
            },
            {
                path: 'recording', 
                name: 'Recording',
                component: () => import('../views/Recording.vue')
            },
            {
                path: 'chat',
                name: 'ReaderChat',
                component: () => import('../components/ChatBot.vue')
            }
        ] // 注意：children数组需要正确闭合
  },
    {
        path: '/super',
        name: 'Super',
        component: () => import('../components/Super.vue'),
        children:[
            {
                path: '',
                name: 'FrontIndex',
                component: () => import('../views/Index.vue'),
            },
             {
                path: 'superadmin',
                name: 'Superadmin',
                component: () => import('../views/SuperAdmin.vue')
             },
              {
                path: 'notice',
                name: 'Notice',
                component: () => import('../views/SuperNotice.vue')
             },
              {
                path: 'knowledge',
                name: 'SuperKnowledge',
                component: () => import('../views/Knowledge.vue')
             },
              {
                path: 'datas',
                name: 'SuperDatas',
                component: () => import('../views/Data.vue')
             },
              {
                path: 'spersonalcenter',
                name: 'Sersonalcenter',
                component: () => import('../views/SPersonalCenter.vue')
             },
             {
                path: 'chat',
                name: 'SuperChat',
                component: () => import('../components/ChatBot.vue')
             }
            ],
        meta: {
            requiresAuth: true
        }
    },
    
]

const router = createRouter({
    history: createWebHistory(),
    routes,
  })

function isAuthenticated() {
    // 兼容多种历史存储键，统一判定登录态
    return !!(sessionStorage.getItem('user')
        || sessionStorage.getItem('reader')
        || sessionStorage.getItem('admin')
        || sessionStorage.getItem('super'));
}
//全局前置守卫
router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (to.name !=="Login" && !isAuthenticated()) { // 假设这是一个检查用户是否已登录的函数
            next({ path: '/' }); // 用户未登录，重定向到首页
        } else {
            next(); //用户已登录，继续导航
        }
        } else {
            next(); //确保一定要调用 next()
    }
})

  //导出路由对象
  export default router