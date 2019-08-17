const gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    path = require('path'),
    minimatch = require('minimatch'),
    through2 = require('through2'),
    del      = require('del'),
    inquirer = require('inquirer');
    // sprite = require('css-sprite').stream,
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
            sprites: path.join(imageRoot, 'sprites')
        }
    }
}
exports.default = compile

function compile () {
    return gulp.series(scripts, imageAndStyles)
}
exports.compile = compile

function release () {
    return gulp.series(update, compile, bump)
}
exports.release = release

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

function imageAndStyles () {
    return gulp.series(copyStyles, dataURI, function () {
        var emoticonFilter = getEmoticonFilter(),
        cssFilter = $.filter('**.css'),
        emoticonCssFilter = $.filter('**.css'),
        emoticonPngFilter = $.filter('**.png');

    return gulp.src('./src/images/emoji/*.png')

        // copy images over as they are

        .pipe(gulp.dest(paths.dist.images.separate))

        // generate emoticon sprites

        .pipe(emoticonFilter)
        .pipe(sprite({
            name: 'emojify-emoticons',
            style: 'emojify-emoticons.css',
            prefix: 'emoji',
            cssPath: '../../images/sprites/',
            orientation: 'binary-tree',
            retina: true,
            template: './build/sprites.mustache'
        }))
        .pipe(emoticonCssFilter)
        .pipe($.replace('.emoji-+1', '.emoji-plus1'))
        .pipe(gulp.dest(paths.dist.styles.sprites))
        .pipe($.minifyCss())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.sprites))
        .pipe(emoticonCssFilter.restore())
        .pipe(emoticonPngFilter)
        .pipe(gulp.dest(paths.dist.images.sprites))
        .pipe(emoticonPngFilter.restore())
        .pipe($.filter('!**sprites**')) //exclude generated spritesheets
        .pipe(emoticonFilter.restore())

        // generate all sprites

        .pipe(sprite({
            name: 'emojify',
            style: 'emojify.css',
            prefix: 'emoji',
            cssPath: '../../images/sprites/',
            orientation: 'binary-tree',
            retina: true,
            template: './build/sprites.mustache'
        }))
        .pipe(cssFilter)
        .pipe($.replace('.emoji-+1', '.emoji-plus1'))
        .pipe(gulp.dest(paths.dist.styles.sprites))
        .pipe($.minifyCss())
        .pipe($.rename({
             suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.sprites))
        .pipe(cssFilter.restore())
        .pipe($.filter('**.png'))
        .pipe(gulp.dest(paths.dist.images.sprites));
    })
}
exports.imageAndStyles = imageAndStyles

function dataURI () {
    var emoticonFilter = getEmoticonFilter();

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

function copyStyles (){
    gulp.src('./src/css/basic/*.css')
        .pipe(gulp.dest(paths.dist.styles.basic))
        .pipe($.minifyCss())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dist.styles.basic));
}

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

function update () {
    const emojiPath = `./v2/images/emoji`
    del(emojiPath);

    const emojiMap = require('emoji-datasource-apple').reduce((acc, emoji) => ({
        ...acc,
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
}
exports.update = update
