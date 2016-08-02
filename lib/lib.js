
module.exports = {

  facebook_post_analyzer: function () {

    var raw_data
    var stop_words
    var user_data = {}

    //declaring all these so that we can reassign
    //them inside the loops without re-instiating
    //thus, saving shit tons memory
    var comment_like_count
    var comment_user_name
    var comment_user_id
    var comment_words
    var comment_word_count
    var comment_time
    var comment_day
    var comment_hour
    var comment_content

    var reply_like_count
    var reply_user_name
    var reply_user_id
    var reply_words
    var reply_word_count
    var reply_time
    var reply_day
    var reply_hour
    var reply_content

    /* the following functions are private to this class */

    //
    function processData(){

      if(!raw_data){
        console.log('No raw comment data provided!')
        return
      }

      if(typeof raw_data != 'object' && typeof raw_data != 'array'){
        console.log('Improperly formatted raw comment data provided!')
        return
      }

      for(comment in raw_data){

        comment_user_name = raw_data[comment].from.name
        comment_user_id  = raw_data[comment].from.id

        if(!!raw_data[comment].likes){
          comment_like_count = raw_data[comment].likes.data.length
        }else{
            comment_like_count = 0
        }

        comment_time = raw_data[comment].created_time
        comment_content = sanitizeComment(raw_data[comment].message)
        comment_words = comment_content.split(' ')
        comment_word_count = comment_words.length

        if(!!raw_data[comment].comments){
          comment_replies = raw_data[comment].comments.data
        }else{
            comment_replies = false
        }

        ensureUserNode(comment_user_id,comment_user_name)
        updateUserActivity(comment_user_id,comment_time,comment_word_count)
        updateUserWords(comment_user_id,comment_words)
        updateUserPerformance(comment_user_id,comment_like_count)

        if(!!comment_replies){
          if(comment_replies.length > 0){
            for(response in comment_replies){
              processReply(comment_replies[response])
            }
          }
        }

      }

    }
    //

    //
    function ensureUserNode( user_id , user_name ){
      if(!user_data[user_id]){
        user_data[user_id] = {}
        user_data[user_id].name = user_name
        user_data[user_id].id = user_id
        user_data[user_id].words = {}
        user_data[user_id].activity = {}
        user_data[user_id].total_words = 0
        user_data[user_id].total_likes = 0
      }
    }
    //

    //
    function updateUserActivity(user_id,time,word_count){
      //breaking down the days/hours into a tree
      var date = new Date(time)
      day = date.getDay()
      hour = date.getHours()

      //day is going to be 0-6
      //representing the 7 days of the week
      if(!user_data[user_id].activity[day]){
        user_data[user_id].activity[day] = {}
      }

      //hour is going to be 0-23
      //representing the 24 hours in a day
      if(!user_data[user_id].activity[day][hour]){
        user_data[user_id].activity[day][hour] = 0
      }

      user_data[user_id].activity[day][hour] += word_count
      user_data[user_id].total_words += word_count

    }
    //

    //
    function updateUserWords(user_id,words){
      for(word in words){

        if( !isAStopWord(words[word]) && words[word] != '' ){
          if( !user_data[user_id].words[words[word]] ){
            user_data[user_id].words[words[word]] = 1
          }else{
            user_data[user_id].words[words[word]]++
          }
        }

      }
    }
    //

    //
    function updateUserPerformance(user_id,likes){
      user_data[user_id].total_likes += likes
    }
    //

    //
    function processReply(reply){
      reply_like_count = reply.like_count
      reply_user_name  = reply.from.name
      reply_user_id   = reply.from.id
      reply_content = sanitizeComment(reply.message)
      reply_words   = reply_content.split(' ')
      reply_word_count = reply_words.length
      reply_time = reply.created_time

      ensureUserNode(reply_user_id,reply_user_name)
      updateUserActivity(reply_user_id,reply_time,reply_word_count)
      updateUserWords(reply_user_id,reply_words)
      updateUserPerformance(reply_user_id,reply_like_count)

      if(!!reply.comments){
        for(response in reply.comments.data){
          processReply(reply.comments.data[response])
        }
      }
    }
    //

    //
    function isAStopWord(word) {
      //returns true if the term is a stop word
      //returns false if not
      return stop_words.indexOf(word) > -1
    }
    //

    //
    function sanitizeComment(comment){

      if(!comment) return ''

      //goodbye special chars
      comment = comment.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')

      //goodbye new lines
      comment = comment.replace('/n', '')

      //goodbye punctuation
      comment = comment.replace(/['".,\/#!$%\^&\*;:{}=\-_`~()?<>|^+]/g,'')

      //goodbye extra weird spaces
      comment = comment.replace(/\s{2,}/g,' ')

      //let's make it all lowercase
      comment = comment.toLowerCase()

      return comment
    }
    //

    /* END functions that are private to this class */

    /*
    return FUNCTIONS
    these are the publicly available functions
    which can be used in external files
    */
    return{
      /*
      *** importData ***
      encapsulates raw facebook comments
      */
      importData: function(data){
        raw_data = data
      },
      /*
      *** importStopWords ***
      encapsulates stop words

      What are stop words?
      http://xpo6.com/list-of-english-stop-words/
      */
      importStopWords: function(data){
        stop_words = data
      },
      /*
      *** processData ***
      process the raw comments against the stop words
      to produce statistics for each user
      */
      processData: function(){
        processData()
      },
      /*
      *** fetchUserData ***
      returns the processed data
      */
      fetchUserData: function(){
        return user_data
      }
    }
    /*
    /return
    */

  }
};
