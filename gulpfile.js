//create variables for directories' names

//const project_folder = "dist";

const project_folder = require('path').basename(__dirname);
const source_folder = "#src";

const fs = require('fs')
//create object with paths for dist,
// src files for watching changes
const path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + project_folder + "/",
};

const {src, dest} = require('gulp');
const gulp = require('gulp');

//plugin browser-sync for updating browser
const browser_sync = require('browser-sync').create();

//add files into root file
const file_include = require('gulp-file-include');

//clean directory dist before every build
const del = require('del');

//add styles
const scss = require('gulp-sass')(require('sass'));

//add prefixes to css properties
const autoprefixer = require('gulp-autoprefixer');

//collect all media queries together in the end of file
const group_media = require('gulp-group-css-media-queries');

//clean minimize CSS
const cleanCSS = require('gulp-clean-css');

//creation additional optimized files
const rename = require("gulp-rename");

//reduce size .js
const uglify = require('gulp-uglify-es').default;

//reduce size images
const imagemin = require('gulp-imagemin');

//convert to webP
const webp = require('gulp-webp');

//replace img to picture tag
const webpHTML = require('gulp-webp-html');

//replace img to picture tag
const webpcss = require("gulp-webpcss");

//FONTS
//convert into different extensions
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

const browserSync = () => {
  browser_sync.init({
    server: {
      baseDir: "./" + project_folder + "/"
    },
    //port for  project running
    port: 3000,
    //notifications are off
    notify: false,
  })
};

//html processing
const html = () => {
  return src(path.src.html)
    .pipe(file_include())
    .pipe(webpHTML())
    .pipe(dest(path.build.html))
    .pipe(browser_sync.stream())
}

//scss processing
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
    .pipe(browser_sync.stream())
}

//js processing
const js = () => {
  return src(path.src.js)
    .pipe(file_include())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(dest(path.build.js))
    .pipe(browser_sync.stream())
}

//IMG processing
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
    .pipe(browser_sync.stream())
}

//fonts processing
const fonts = () => {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', () => {
  return src([source_folder + './fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(source_folder + './fonts/'))
})

const fontsStyle = () => {

  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content === '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname !== fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

const cb = () => {
}

const watchFiles = () => {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

const clean = () => {
  return del(path.clean)
}

//build production vers
let build = gulp.series(clean, gulp.parallel(css, html, js, images, fonts), fontsStyle);

//watching file's changes and reload browser
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;