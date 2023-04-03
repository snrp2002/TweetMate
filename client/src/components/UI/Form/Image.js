import addImage from "../../../images/add-image.png";
import classes from "./Image.module.css";
import Compressor from "compressorjs";
const Image = (props) => {
  const getBase64 = (file) => {
    return new Promise((resolve) => {
      let baseURL = "";
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        baseURL = reader.result;
        resolve(baseURL);
      };
    });
  };
  const handleFileInputChange = (e) => {
    let file = e.target.files[0];
    new Compressor(file, {
      quality: 0.6,
      success: (compressedFile) => {
        getBase64(compressedFile)
          .then((result) => {
            file["base64"] = result;
            props.onDone(result);
          })
          .catch((err) => {
            console.log(err);
          });
      },
    });
  };

  return (
    <>
      <div className={classes.inputDiv}>
        <label
          htmlFor="file"
          onClick={() => document.getElementById("file").click}
        >
          <img src={addImage} alt="add" />
          <div>Add Image*</div>
        </label>
        <input
          id="file"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileInputChange}
        />
      </div>
      <div className={classes.preview}>
        {props.value && <img src={props.value} alt="dp" />}
      </div>
    </>
  );
};
export default Image;
