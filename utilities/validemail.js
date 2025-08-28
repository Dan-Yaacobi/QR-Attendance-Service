export function isValidEmail(s){
    const known_suffix = ["com","co.il"]
    if (typeof(s) !== 'string'){
        return false
    }
    let suffix = ""
    let at_found = false
    let dot_found = false
    let too_many_ats = false

    for(let i = 0; i < s.length; i++){
        if (dot_found){
            suffix += s[i]
        }
        if (at_found){
            if(s[i] === '@'){
                too_many_ats = true
                break
            }
            if(s[i] === '.' && !dot_found){
                dot_found = true
            }
        }
        else{
            if(s[i] === '@'){
                at_found = true
            }
        }
    }
    
    return (at_found && dot_found && known_suffix.includes(suffix) && !too_many_ats)
}