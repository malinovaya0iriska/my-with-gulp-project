const PROJECT_FOLDER = require('path').basename(__dirname);
const SOURCE_FOLDER = "#src";

const {src, dest, series, parallel, watch} = require('gulp');

const browserSync = require('browser-sync').create();
const file_include = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const group_media = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webpHTML = require('gulp-webp-html');
const webpcss = require("gulp-webpcss");
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');


const path = {
  build: {
    html: `${PROJECT_FOLDER}/`,
    css: `${PROJECT_FOLDER}/css/`,
    js: `${PROJECT_FOLDER}/js/`,
    img: `${PROJECT_FOLDER}/img/`,
    fonts: `${PROJECT_FOLDER}/fonts/`,
  },
  src: {
    html: [`${SOURCE_FOLDER}/*.html`, `!${SOURCE_FOLDER}/_*.html`],
    css: `${SOURCE_FOLDER}/scss/style.scss`,
    js: `${SOURCE_FOLDER}/js/script.js`,
    img: `${SOURCE_FOLDER}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
    fonts: `${SOURCE_FOLDER}/fonts/*.ttf`,
  },
  watch: {
    html: `${SOURCE_FOLDER}/**/*.html`,
    css: `${SOURCE_FOLDER}/scss/**/*.scss`,
    js: `${SOURCE_FOLDER}/js/**/*.js`,
    img: `${SOURCE_FOLDER}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
  },
  clean: `./${PROJECT_FOLDER}/`,
};

const browserSyncSet = () => {
  browserSync.init({
    server: {
      baseDir: "./" + PROJECT_FOLDER + "/"
    },
    port: 3000,
    notify: false,
  })
};

const html = () => {
  return src(path.src.html)
    .pipe(file_include())
    .pipe(webpHTML())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
}

const css = () => {
  return src(path.src.css)
    .pipe(scss({outputStyle: 'expanded'}))
    .pipe(group_media())
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 5 versions'],
      cascade: true
    }))
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream())
}

const js = () => {
  return src(path.src.js)
    .pipe(file_include())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
}

const images = () => {
  return src(path.src.img)
    .pipe(webp({
      quaality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.optipng({optimizationLevel: 4}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })]))
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream())
}

const fonts = () => {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

const otf2ttf = () => {
  return src([SOURCE_FOLDER + './fonts/!*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(SOURCE_FOLDER + './fonts/'))
}

const watchFiles = () => {
  watch([path.watch.html], html)
  watch([path.watch.css], css)
  watch([path.watch.js], js)
  watch([path.watch.img], images)
}

const clean = () => {
  return del(path.clean)
}

const build = series(clean, parallel(html, css, js, images, fonts, otf2ttf));

const watchProcess = parallel(series(build, browserSyncSet), watchFiles);


module.exports = {
  otf2ttf,
  fonts,
  images,
  js,
  css,
  html,
  build,
  watchProcess,
  default:
  watchProcess
}
