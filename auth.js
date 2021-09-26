const passport = require('passport');
const bcrypt = require('bcrypt')
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github');
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();

module.exports = function (app, myDataBase) {
// Serialization and deserialization here...
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
    done(null, doc);
  });
});

 passport.use(new LocalStrategy(
   function(username,password,done){
     myDataBase.findOne({username:username},function(err,user){
       if(err) console.log('User '+ username +' attempted to log in.');
       if(!user){return done(null,false)};
       if(!bcrypt.compareSync(password,user.password)){return done(null,false)};
       return done(null,user);
     })
   }
 ));

  passport.use(new GithubStrategy(
    {
      clientID:process.env.GITHUB_CLIENT_ID,
      clientSecret:process.env.GITHUB_CLIENT_SECRET,
      callbackURL:'https://boilerplate-advancednode.little-sealion.repl.co/auth/github/callback'
    },
   function(accessToken, refreshToken, profile, done){
     console.log(profile),
     myDataBase.findOneAndUpdate(
  { id: profile.id },
  {
    $setOnInsert: {
      id: profile.id,
      username: profile.displayName || 'John Doe',
      photo: profile.photos[0].value || '',
      email: Array.isArray(profile.emails)
        ? profile.emails[0].value
        : 'No public email',
      created_on: new Date(),
      provider: profile.provider || ''
    },
    $set: {
      last_login: new Date()
    },
    $inc: {
      login_count: 1
    }
  },
  { upsert: true, new: true },
  (err, doc) => {
    return done(null, doc.value);
  }
);
  }
))
}
