/// <reference types="vitest" />

import path from 'node:path'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
// https://vitejs.dev/config/

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname)
    const chunkName = mode === 'prebuild' ? '[name]' : 'chunk'

    return {
        base: mode === 'file' ? './' : '/',
        plugins: [
            vue(),
            // 仅在file模式下启用legacy插件
            ...(mode === 'file' ? [legacy({
                additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
                modernPolyfills: false, // 禁用现代 polyfills 以减少内存占用
            })] : []),
            // 仅在显式开启 ANALYZE 时启用 visualizer，避免分析报告被打包进生产产物
            ...(mode !== 'file' && process.env.ANALYZE === 'true' ? [
                visualizer({
                    emitFile: true, // 输出到构建产物目录
                    filename: 'stats.html', // 生成分析网页文件名
                    open: false, // 在默认用户代理中打开生成的文件（构建时关闭，避免崩溃）
                    gzipSize: true, // 从源代码中收集 gzip 大小并将其显示在图表中
                    brotliSize: true, // 从源代码中收集 brotli 大小并将其显示在图表中
                })
            ] : []),
            // SVG图标插件始终启用，但对file模式进行优化
            createSvgIconsPlugin({
                // 指定需要缓存的图标文件夹
                iconDirs: [path.resolve(process.cwd(), 'src/icons')],
                // 指定symbolId格式
                symbolId: 'icon-[dir]-[name]',
            }),
            AutoImport({
                resolvers: [
                    // 自动导入图标组件
                    IconsResolver({
                        prefix: 'Icon',
                    }),
                ],
                dts: path.resolve(path.resolve(__dirname, 'src'), 'auto-imports.d.ts'),
            }),
            Components({
                resolvers: [
                    // 自动注册图标组件
                    IconsResolver({
                        enabledCollections: ['ep'],
                    }),
                ],
                dts: path.resolve(path.resolve(__dirname, 'src'), 'components.d.ts'),
            }),
            Icons({
                autoInstall: true,
            }),
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "@/style/global.scss" as *;',
                },
            },
            // postcss: {
            //     plugins: [
            //         require('tailwindcss'),
            //         require('autoprefixer'),
            //     ]
            // }
        },
        server: {
            host: 'localhost',
            port: 6719,
            proxy: {
                '/api': {
                    target: env.VITE_BASE_URL,
                    // 是否跨域
                    changeOrigin: true,
                    // 路径重写
                    rewrite: path => path.replace(/^\/api/, ''),
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: {
            outDir: mode === 'file' ? 'dist-file' : 'dist',
            minify: mode === 'file' ? false : (mode === 'prebuild' ? 'esbuild' : 'terser'), // file 模式不压缩以减少内存占用
            ...(mode === 'file' ? {} : {
                terserOptions: {
                    compress: {
                        // 生产环境时移除console
                        drop_console: true,
                        drop_debugger: true,
                    },
                },
            }),
            //   关闭文件计算
            reportCompressedSize: false,
            //   关闭生成map文件 可以达到缩小打包体积
            sourcemap: false, // 这个生产环境一定要关闭，不然打包的产物会很大
            rollupOptions: {
                output: {
                    chunkFileNames: mode === 'file' ? 'js/[name]-[hash].js' : `js/${chunkName}-[hash].js`, // 引入文件名的名称
                    entryFileNames: mode === 'file' ? 'js/[name]-[hash].js' : `js/${chunkName}-[hash].js`, // 包的入口文件名称
                    assetFileNames: mode === 'file' ? '[ext]/[name]-[hash].[ext]' : `[ext]/${chunkName}-[hash].[ext]`, // 资源文件像 字体，图片等
                    manualChunks: mode === 'file' ? undefined : function manualChunks(id) {
                        if (id.includes('/node_modules/xlsx/')) {
                            return 'xlsx'
                        }
                        if (
                            id.includes('/node_modules/three/')
                            || id.includes('/node_modules/three-css3d/')
                            || id.includes('/node_modules/@tweenjs/tween.js/')
                        ) {
                            return 'three'
                        }
                    },
                },
            },
        },
        // 使用这个必须在上面加/// <reference types="vitest" /> 不然会有类型报错
        test: {
            globals: true, // --> 0.8.1+  请修改成globals
            environment: 'jsdom',
            // include: ['**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            // passWithNoTests: true,
            transformMode: {
                web: [/\.[jt]sx$/],
            },
        },
    }
})
