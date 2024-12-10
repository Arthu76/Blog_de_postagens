//Carregando Modulos
const express = require('express');
const { create } = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const admin = require('./routes/admin');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
require('./models/Postagem');
const Postagem = mongoose.model('postagens');
require('./models/Categoria');
const Categoria = mongoose.model('categorias');
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);

//Configurações
//----Session & Flash
app.use(
  session({
    secret: 'cursonode',
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//----MiddleWare
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');

  res.locals.user = req.user || null;
  next();
});

//----Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//----HandleBars
const handlebars = create({
  defaultLayout: 'main',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//----Mongoose
mongoose.Promise = global.Promise;
mongoose
  .connect('mongodb://localhost/blogapp')
  .then(() => {
    console.log('MongoDB Conectado');
  })
  .catch(erro => {
    console.log(`houve um erro ${erro}`);
  });

//----Public
app.use(express.static(path.join(__dirname, 'public')));

//Rotas
app.get('/', (req, res) => {
  Postagem.find()
    .populate('categoria')
    .sort({ data: 'desc' })
    .then(postagens => {
      res.render('index', { postagens: postagens });
    })
    .catch(err => {
      req.flash('error_msg', 'Houve um erro interno');
      res.redirect('/404');
    });
});

app.get('/postagem/:slug', (req, res) => {
  Postagem.findOne({ slug: req.params.slug })
    .then(postagem => {
      if (postagem) {
        res.render('postagem/index', { postagem: postagem });
      } else {
        req.flash('error_msg', 'Essa postagem não existe');
        res.redirect('/');
      }
    })
    .catch(err => {
      req.flash('error_msg', 'Houve um erro interno');
      res.redirect('/');
    });
});

app.get('/categorias', (req, res) => {
  Categoria.find()
    .then(categorias => {
      res.render('categorias/index', { categorias: categorias });
    })
    .catch(err => {
      req.flash('error_msg', 'Houve um erro interno ao listar as categorias');
      res.redirect('/');
    });
});

app.get('/categorias/:slug', (req, res) => {
  Categoria.findOne({ slug: req.params.slug })
    .then(categoria => {
      if (categoria) {
        Postagem.find({ categoria: categoria._id })
          .then(postagens => {
            res.render('categorias/postagens', {
              postagens: postagens,
              categoria: categoria,
            });
          })
          .catch(err => {
            req.flash('error_msg', 'Houve um erro interno ao listar os posts');
            res.redirect('/');
          });
      } else {
        req.flash('error_msg', 'Essa categoria não existe');
        res.redirect('/');
      }
    })
    .catch(err => {
      req.flash('error_msg', 'Houve um erro interno');
      res.redirect('/');
    });
});

app.get('/404', (req, res) => {
  res.send('Erro 404!');
});

app.get('/posts', (req, res) => {
  res.send('Lista de Posts');
});

app.use('/admin', admin);
app.use('/usuarios', usuarios);

//Outros
const PORT = 8081;
app.listen(PORT, () => {
  console.log('Servidor Rodando...');
});
