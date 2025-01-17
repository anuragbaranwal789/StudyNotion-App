import { Route, Routes } from "react-router-dom";
import "./App.css";

// Redux
import { useDispatch, useSelector } from "react-redux"

// Component Imports
import Navbar from "./components/common/Navbar";
import OpenRoute from "./components/core/Auth/OpenRoute";
import PrivateRoute from "./components/core/Auth/PrivateRoute";
import MyProfile from "./components/core/Dashboard/MyProfile";
import Settings from "./components/core/Dashboard/Settings";
import EnrolledCourses from "./components/core/Dashboard/EnrolledCourses";
import Cart from "./components/core/Dashboard/Cart";
import MyCourses from "./components/core/Dashboard/MyCourses";
import AddCourse from "./components/core/Dashboard/AddCourse";
import EditCourse from "./components/core/Dashboard/EditCourse";
import VideoDetails from "./components/core/ViewCourse/VideoDetails";
import Instructor from "./components/core/Dashboard/Instructor";

// Page Imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Error from "./pages/Error";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import CourseDetails from "./pages/CourseDetails";
import ViewCourse from "./pages/ViewCourse";

// Constant Imports
import { ACCOUNT_TYPE } from "./utils/constants"

function App() {
  const { user } = useSelector((state) => state.profile)
  return (
    <div className="w-screen min-h-screen bg-richblack-900 flex flex-col font-inter">
      <Navbar/>
      <Routes>
        <Route path = "/" element = {<Home/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="catalog/:catalogName" element={<Catalog/>}/>
        <Route path="courses/:courseId" element={<CourseDetails/>}/>
        {/* Open Route - for Only Non Logged in User */}
        <Route path="signup" element={<OpenRoute> <Signup/> </OpenRoute>}/>
        <Route path="verify-email" element={ <OpenRoute> <VerifyEmail/> </OpenRoute>}/>
        <Route path="login" element={<OpenRoute> <Login/> </OpenRoute>}/>
        <Route path="forgot-password" element={<OpenRoute> <ForgotPassword/> </OpenRoute>}/>
        <Route path="update-password/:id" element={<OpenRoute> <UpdatePassword/> </OpenRoute>}/>
        {/* Private Route - for Only Logged in User */}
        <Route element={<PrivateRoute> <Dashboard/> </PrivateRoute>}>
          {/* Route for all users */}
          <Route path="dashboard/my-profile" element={<MyProfile/>}/>
          <Route path="dashboard/Settings" element={<Settings/>}/>
          {/* Route only for Students */}
          {user?.accountType === ACCOUNT_TYPE.STUDENT && (
            <>
              <Route path="dashboard/enrolled-courses" element={<EnrolledCourses/>}/>
              <Route path="/dashboard/cart" element={<Cart/>}/>
              <Route path="dashboard/settings" element={<Settings/>}/>
            </>
          )}
          {/* For the Students to watch Course's lectures */}
          <Route element={<PrivateRoute> <ViewCourse /> </PrivateRoute>}>
            {user?.accountType === ACCOUNT_TYPE.STUDENT && (
              <>
                <Route path="view-course/:courseId/section/:sectionId/sub-section/:subSectionId" element={<VideoDetails/>}/>
              </>
            )}
          </Route>
          {/* Route only for Instructors */}
          {user?.accountType === ACCOUNT_TYPE.INSTRUCTOR && (
            <>
              <Route path="dashboard/instructor" element={<Instructor/>} />
              <Route path="dashboard/my-courses" element={<MyCourses/>} />
              <Route path="dashboard/add-course" element={<AddCourse/>} />
              <Route path="dashboard/edit-course/:courseId" element={<EditCourse/>}/>
            </>
          )}
        </Route>
        {/* 404 Page */}
        <Route path="*" element={<Error/>}/>
      </Routes>
    </div>
  );
}

export default App;