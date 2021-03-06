const { json } = require("body-parser");
const Question = require("../models/question.model");
const Subject = require("../models/subject.model");
const paginate = require('mongoose-paginate')
module.exports.postQuestion = (req, res) => {
    console.log('req.body', req.body);
    let newQuestion = new Question({
        title: req.body.title,
        answers: req.body.answers,
        level: req.body.level,
        test_id: req.body.test_id,
        subject_id: req.body.subject_id,
    });
    newQuestion.save();
    console.log('newQuestion', newQuestion)
    res.status(201).json(newQuestion);
}
module.exports.getQuestion = (req, res) => {
    const id = req.params.id;
    console.log('get question by qs_id', req.params)
    Question.findOne({ _id: id }, (err, question) => {
        if (err) console.log(err)
        console.log(question)
        res.status(200).send(question);
    })
}
module.exports.getQuestions = (req, res) => {
    console.log('pagination', req.params)
    const author = req.params.author;
    const id = req.params.subject_id;
    const page = req.params.page;
    const perPage = 10;
    console.log('get questions for subject')
    Subject.aggregate([
        { $match: { author: author } },
        {
            $project: {
                _id: {
                    $toString: "$_id",
                },
                subjectname: 1
            }
        },
        {
            $lookup: {
                from: 'questions',
                localField: '_id',
                foreignField: 'subject_id',
                as: 'questions'
            }
        },
        { $unwind: '$questions' },
        {
            $project: {
                answers: "$questions.answers",
                title: "$questions.title",
                level: "$questions.level",
                qs_id: "$questions._id"
            }
        },
        {
            $match: { _id: id }
        },
        {
            $project: {
                _id: {
                    $toString: "$qs_id",
                },
                answers: 1,
                title: 1,
                level: 1,
            }
        },
    ]).exec(
        (err, questions)  => {
            if(err) console.log(err);
            console.log(questions)
            const total = questions.length
            let limit = page*perPage
            let start = perPage*(page - 1)
            const qsOnePage=[];
            for(let i=start;i<limit;i++){
                if(i<total){
                    qsOnePage.push(questions[i])
                }
                else{
                    break;
                }
            }
            res.status(200).send({qsOnePage: qsOnePage, total: total});
            })
    // Question.find({subject_id:id},(err, questions)  => {
    //     if(err) console.log(err);
    //     const total = questions.length
    //     let limit = page*perPage
    //     let start = perPage*(page - 1)
    //     const qsOnePage=[];
    //     for(let i=start;i<limit;i++){
    //         if(i<total){
    //             qsOnePage.push(questions[i])
    //         }
    //         else{
    //             break;
    //         }
    //     }
    //     res.status(200).send({qsOnePage: qsOnePage, total: total});
    // })
}

module.exports.getQtyqs = (req, res) => {
    console.log('get qty questions', req.params)
    const subject_id = req.params.subject_id;
    let hardQty = 0;
    let normalQty = 0;
    let easyQty = 0;
    Question.find({ subject_id: subject_id }, (err, questions) => {
        // if(err) console.log(err)
        questions.forEach(question => {
            if (question.level == 1) {
                easyQty++;
            }
            else if (question.level == 2) {
                normalQty++;
            }
            else {
                hardQty++;
            }
        });
        res.status(200).json({ easyQty: easyQty, normalQty: normalQty, hardQty: hardQty });
    })
}

function getQs(qty, qsArr) {
    const total = qsArr.length;
    if (qty > total) return -1;
    let idxArr = [];
    let res = [];
    let l = 0;
    while (l < qty) {
        idxArr.push(Math.floor(total * Math.random()))
        idxArr = [... new Set(idxArr)];
        l = idxArr.length;
    }
    idxArr.forEach(idx => {
        res.push(qsArr[idx]);
    })
    return res;
}
module.exports.getQuestionsForTest = (req, res) => {
    const id = req.body.subject_id;
    const test_id = req.body._id;
    console.log('id test', req.body._id)
    const hardQty = req.body.hardQty;
    const normalQty = req.body.normalQty;
    const easyQty = req.body.easyQty;
    const hardQs = [];
    const normalQs = [];
    const easyQs = [];
    // console.log('test', req.body)
    Question.find({ subject_id: id }, (err, questions) => {
        if (err) console.log(err);
        questions.forEach(question => {
            if (question.level == 1) {
                easyQs.push(question);
            }
            else if (question.level == 2) {
                normalQs.push(question);
            }
            else {
                hardQs.push(question);
            }
        })
        const res1 = getQs(easyQty, easyQs);
        const res2 = getQs(normalQty, normalQs);
        const res3 = getQs(hardQty, hardQs);
        if (res1 === -1 || res2 === -1 || res3 === -1) {
            res.status(200)
                .send({ susscess: false, easyTotal: easyQs.length, normalTotal: normalQs.length, hardTotal: hardQs.length });
        }
        else {
            const qsForTest = res1.concat(res2, res3);
            res.status(200).send({ susscess: true, questions: qsForTest });
        }
    })

}
module.exports.editQuestion = (req, res) => {
    console.log('edit question', req.body)
    const id = req.params.id;
    const question = Question.where({ _id: id });
    if (question.title != req.body.title) {
        question.updateOne({ $set: { title: req.body.title } }).exec();
    }
    if (question.level != req.body.level) {
        question.updateOne({ $set: { level: req.body.level } }).exec();
    }
    question.updateOne({ $set: { answers: req.body.answers } }).exec();
}
module.exports.delQuestion = (req, res) => {
    const id = req.params.id;
    console.log('delete question by id', id)
    Question.findOne({ _id: id })
        .deleteOne()
        .exec((err, result) => {
            if (err) console.log(err);
            console.log(result);
        })
    res.status(200).send({ success: true, id: id });
}







