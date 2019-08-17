const gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    path = require('path'),
    del      = require('del'),
    inquirer = require('inquirer');
    ts = require('gulp-typescript'),
    tsProject = ts.createProject('tsconfig.json');

const distRoot = path.resolve('./distv2')
const scriptRoot = path.join(distRoot, 'js')
const styleRoot = path.join(distRoot, 'css')
const imageRoot = path.join(distRoot, 'image')
const paths = {
    dist: {
        root: distRoot,
        scripts: scriptRoot,
        styles: {
            root: styleRoot,
            dataURI: path.join(styleRoot, 'data-uri'),
            sprites: path.join(styleRoot, 'sprites'),
            basic: path.join(styleRoot, 'basic')
        },
        images: {
            root: imageRoot,
            separate: path.join(imageRoot, 'basic'),
            sprites: path.join(imageRoot, 'sprites'),
        }
    }
}
function scripts () {
    const pkg = require('./package.json');
    return tsProject.src()
        .pipe(tsProject())
        .js
        // TODO: Do tslint
        // .pipe($.jshint())
        // .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.insert.prepend('/*! ' + pkg.name + ' - v' + pkg.version + ' - \n' +
            ' * Copyright (c) Hassan Khan ' + new Date().getFullYear() + '\n' +
            ' */'))
        .pipe($.uglify({
            output: {
                comments: /##EMOJILIST/
            }
        }))
        .pipe($.rename({
            suffix: '.min'
        }))
        // .pipe($.replace(/(\/\*##EMOJILIST\*\/).+$/m, '$1"' + emoji.substr(1) + '";'))
        .pipe(gulp.dest(paths.dist.scripts));
}
exports.scripts = scripts

var getEmoticonFilter = function(){
    var emoticons = [
        'smile', 'scream', 'smirk', 'grinning', 'stuck_out_tongue_closed_eyes', 'stuck_out_tongue_winking_eye',
        'rage', 'frowning', 'sob', 'kissing_heart', 'wink', 'pensive', 'confounded', 'flushed', 'relaxed', 'mask',
        'heart', 'broken_heart'
    ];

    return $.filter(function(file){
        var index = emoticons.indexOf(path.basename(file.path, path.extname(file.path)));
        if(index > -1){
            emoticons.splice(index, 1);
            return true;
        }
    })
};

const imageAndStyles = gulp.series(copyStyles, dataURI, function () {
    const emojiPath = paths.dist.images.separate
    del(emojiPath);

    const emojiMap = require('emoji-datasource-apple').reduce((acc, emoji) => Object.assign(acc, {
        [emoji.image]: emoji
    }), {})
    const availableFiles = Object.keys(emojiMap)

    return gulp.src('node_modules/emoji-datasource-apple/img/apple/64/*.png')
        .pipe($.filter(file => availableFiles.includes(file.basename)))
        .pipe($.rename(file => {
            const emojiData = emojiMap[`${file.basename}${file.extname}`]

            file.basename = emojiData.short_name
            file.dirname = './'
        }))
        .pipe(gulp.dest(emojiPath))
})

exports.imageAndStyles = imageAndStyles

function dataURI () {
    const emoticonFilter = getEmoticonFilter();

    return gulp.src('./src/images/emoji/*.png')
        .pipe($.imageDataUri({
            customClass: function(className){
                return 'emoji-' + className
            }
        }))
        .pipe(emoticonFilter)
        .pipe($.concat('emojify-emoticons.css'))
        .pipe($.replace('.emoji-+1', '.emoji-plus1'))
        .pipe(gulp.dest(paths.dist.styles.dataURI))
        .pipe($.minifyCss())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.dataURI))
        .pipe(emoticonFilter.restore())

        // generate all data-URIs

        .pipe($.concat('emojify.css'))
        .pipe($.replace('.emoji-+1', '.emoji-plus1'))
        .pipe(gulp.dest(paths.dist.styles.dataURI))
        .pipe($.minifyCss())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.dataURI));
}
exports.dataURI = dataURI

function copyStyles (){
    return gulp.src('./src/css/basic/*.css')
        .pipe(gulp.dest(paths.dist.styles.basic))
        .pipe($.minifyCss())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.basic));
}
exports.copyStyles = copyStyles

function clean (done) {
    del(paths.dist.root, done);
}
exports.clean = clean


function bump (done) {
    inquirer.prompt({
        type: 'list',
        name: 'bump',
        message: 'What type of bump would you like to do?',
        choices: ['patch', 'minor', 'major', "don't bump"]
    }, function(result){
        if(result.bump === "don't bump"){
            done();
            return;
        }

        gulp.src(['./bower.json', './package.json'])
            .pipe($.bump({type: result.bump}))
            .pipe(gulp.dest('./'))
            .on('end', done);
    });
}
exports.bump = bump

const compile = gulp.series(scripts, imageAndStyles)
exports.default = compile
exports.compile = compile
exports.release = gulp.series(compile, bump)
