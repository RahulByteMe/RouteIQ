function Input({ placeholder, type, value, onChange, name, required }) {
    return(
        <input 
            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
            name={name}
            required={required}

        
        />
    )
}
export default Input;