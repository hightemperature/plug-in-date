const gulp = require('gulp'),
    // 常量
    BUNDLE_DIR = "dist/",
    BUNDLE_NAME = "pop",
    BUNDLE_NAME_V = "Pop",
    BUNDLE_ENTRY = "src",
    BUNDLE_ENTRY_CSS = `${BUNDLE_ENTRY}/scss/index.scss`,
    BUNDLE_ENTRY_JS = `${BUNDLE_ENTRY}/index.js`,

    // Utils
    notify = require('gulp-notify'),
    errHandle = require('gulp-plumber'),
    merge = require('merge-stream'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    clean = require('del'),

    // JS

    // plan one
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify'),

    // plan two
    umd = require('gulp-umd'),
    babel = require('gulp-babel'),

    // CSS
    sass = require('gulp-sass'),
    compress = require('gulp-clean-css'),
    base64 = require('gulp-css-base64'),
    postcss = require('gulp-postcss'),
    cssToJs = require('gulp-css-to-js'),

    // banner
    banner = require('gulp-banner'),
    pkg = require('./package.json'),
    banner_tpl = '/*\n' +
        ' * <%= pkg.name %> <%= pkg.version %>\n' +
        ' * <%= pkg.description %>\n' +
        ' *\n' +
        ' * Copyright 2018, <%= pkg.author %>\n' +
        ' * Released under the <%= pkg.license %> license.\n' +
        '*/\n\n';


// JS
let pkJsStream;
const pkJs = (cb) => {
    // pkJsStream = browserify({
    //     entries: BUNDLE_ENTRY_JS
    // })
    //     .transform("babelify", {
    //         extensions: [".babel", ".js"]
    //     })
    //     .bundle()
    //     .on("error", notify.onError("Error: <%= error %>"))
    //     .pipe(source(`yer.js`))
    //     .pipe(buffer())
    //     .pipe(umd({
    //         exports: function () {
    //             return BUNDLE_NAME_V;
    //         },
    //         namespace: function () {
    //             return BUNDLE_NAME_V;
    //         }
    //     }));

    pkJsStream = gulp.src(BUNDLE_ENTRY_JS)
        .pipe(errHandle({
            errorHandler: notify.onError((error) => {
                return error;
            })
        }))
        .pipe(babel())
        .pipe(umd({
            exports: function () {
                return BUNDLE_NAME_V;
            },
            namespace: function () {
                return BUNDLE_NAME_V;
            }
        }));

    cb && cb();
};
gulp.task('pkJs', pkJs);

// CSS
let pkCssStream;
const pkCss = (cb) => {
    pkCssStream = gulp.src(BUNDLE_ENTRY_CSS)
        .pipe(errHandle({
            errorHandler: notify.onError((error) => {
                return error;
            })
        }))
        .pipe(sass())
        .pipe(postcss())
        .pipe(base64({maxWeightResource: 1024 * 10}))
        .pipe(compress())
        .pipe(cssToJs());

    cb && cb();
};
gulp.task('pkCss', pkCss);

// mergePut
const pkMerge = (cb) => {
    merge(pkJsStream, pkCssStream)
        .pipe(concat(`${BUNDLE_NAME}.js`))
        .pipe(banner(banner_tpl, {pkg}))
        .pipe(gulp.dest(`${BUNDLE_DIR}`))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(uglify())
        .pipe(banner(banner_tpl, {pkg}))
        .pipe(gulp.dest(`${BUNDLE_DIR}`));
    cb && cb();
};
gulp.task('merge', pkMerge);

// clean
const pkClean = (cb) => {
    return clean(
        [
            BUNDLE_DIR
        ]
    );
    cb && cb();
};
gulp.task('clean', pkClean);

// watch
const watch = (cb) => {
    gulp.watch(
        [
            `${BUNDLE_ENTRY}/**/*`
        ],
        gulp.series(
            gulp.parallel(
                'pkJs',
                'pkCss'
            ),
            'merge'
        )
    );
    cb && cb();
};
gulp.task('watch', watch);

// build
gulp.task('build', gulp.series(
    gulp.parallel(
        'pkJs',
        'pkCss'
    ),
    'merge'
));

// dev
gulp.task('dev', gulp.series(
    gulp.parallel(
        'pkJs',
        'pkCss'
    ),
    'merge',
    'watch'
));