
const Singer=require('../model/singers')

module.exports.getSingerProfile = async (res, req) => {
    try {
        const singerName = req.params.singer
        const singer = await Singer.find({ name: singerName.toLowerCase() })
        console.log(singer)
    } catch (error) {
        console.log(error)
    }
}