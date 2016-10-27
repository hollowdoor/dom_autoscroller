"use strict";
//import babel from 'rollup-plugin-babel';
const babel = require('rollup-plugin-babel');
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const writeFile = require('fs').writeFile;
const UglifyJS = require('uglify-js');
const pack = require('./package.json');
const external = Object.keys(pack.dependencies || {});

rollup.rollup({
    entry: 'src/index.js',
    plugins: [babel()],
    external: external
}).then((bundle)=>{
    bundle.write({
        dest: 'dist/bundle.js',
        format: 'cjs',
        moduleName: 'dom-autoscroller',
        sourceMap: true
    });

    bundle.write({
        dest: 'dist/bundle.es.js',
        format: 'es',
        sourceMap: true
    });
});



rollup.rollup({
    entry: 'src/index.js',
    plugins: [
        babel(),
        nodeResolve({
            main: true
        }),
        commonjs()
    ],
}).then((bundle)=>{
    let b = bundle.write({
        dest: 'dist/dom-autoscroller.js',
        format: 'iife',
        sourceMap: true,
        moduleName: 'autoScroll'
    });

    b.then(what=>{

        try{
            var result = UglifyJS.minify('dist/dom-autoscroller.js');
            //console.log('result ',result)
            writeFile('dist/dom-autoscroller.min.js', result, onError);
        }catch(e){
            console.log('minify error ', e)
        }

    })
}).catch(onError);

rollup.rollup({
    entry: 'test/src.js',
    plugins: [
        babel(),
        nodeResolve({
            main: true
        }),
        commonjs()
    ]
}).then(bundle=>{
    //console.log('what')
    bundle.write({
        dest: 'test/code.js',
        format: 'iife',
        sourceMap: true,
        moduleName: 'autoScroll'
    });
}).catch(onError);

function onError(e){
    if(e) console.log(e);
}
