import React, { Component, Fragment } from 'react';
import axios from 'axios';

// Component imports
import { ValidationErrors } from './Errors';
import { AuthContext } from './AuthContext';
import Loading from './Loading';

/**
 * Form for updating an existing course.
 * @param {func} handleChange
 * @param {func} handleSubmit
 * @param {func} handleCancel
 * @returns JSX component
 */
const UpdateForm = ({ handleChange, handleSubmit, handleCancel, course }) => {
  const { title, description, estimatedTime, materialsNeeded } = course;
  const user = course.user[0];

  return (
    <AuthContext.Consumer>
      {context => (
        <form onSubmit={e => handleSubmit(e, context.state.token)}>
          <div className="grid-66">
            <div className="course--header">
              <h4 className="course--label">Course</h4>
              <div>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="input-title course--title--input"
                  placeholder="Course title..."
                  defaultValue={title}
                  onChange={handleChange}
                />
              </div>
              <p>By {user ? `${user.firstName} ${user.lastName}` : null}</p>
            </div>
            <div className="course--description">
              <div>
                <textarea
                  id="description"
                  name="description"
                  className=""
                  placeholder="Enter description..."
                  defaultValue={description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="grid-25 grid-right">
            <div className="course--stats">
              <ul className="course--stats--list">
                <li className="course--stats--list--item">
                  <h4>Estimated Time</h4>
                  <div>
                    <input
                      id="estimatedTime"
                      name="estimatedTime"
                      type="text"
                      className="course--time--input"
                      placeholder="Hours"
                      defaultValue={estimatedTime ? estimatedTime : ''}
                      onChange={handleChange}
                    />
                  </div>
                </li>
                <li className="course--stats--list--item">
                  <h4>Materials Needed</h4>
                  <div>
                    <textarea
                      id="materialsNeeded"
                      name="materialsNeeded"
                      className=""
                      placeholder="List materials..."
                      defaultValue={materialsNeeded ? materialsNeeded : ''}
                      onChange={handleChange}
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="grid-100 pad-bottom">
            <button className="button" type="submit">
              Update Course
            </button>
            <button className="button button-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </AuthContext.Consumer>
  );
};

/**
 * Update Course Component
 * Allows the user to update an existing course.
 * Requires authentication.
 * Requires user to "own" the course.
 */
class UpdateCourse extends Component {
  state = {
    isLoading: true,
    id: this.props.match.params.id,
    course: {
      user: [],
    },
    errors: [],
  };

  dbURI = `http://localhost:5000/api/courses/${this.state.id}`;

  // Request the course details from the API
  componentDidMount() {
    axios
      .get(this.dbURI)
      .then(res => {
        if (res.status === 200) {
          this.setState({ course: res.data, isLoading: false }, () => {
            const currentUserId = this.context.state.user.id;
            const courseOwnerId = this.state.course.user[0]._id;
            if (currentUserId === courseOwnerId) {
              document.querySelector('#title').focus();
            } else {
              this.props.history.push('/forbidden');
            }
          });
        }
      })
      .catch(error => {
        if (error.response.status === 404) {
          this.props.history.push('/notfound');
        } else {
          this.props.history.push('/error');
        }
      });
  }

  // Sets course values based on user entry.
  handleChange = () => {
    const title = document.querySelector('#title').value;
    const description = document.querySelector('#description').value;
    const estimatedTime = document.querySelector('#estimatedTime').value;
    const materialsNeeded = document.querySelector('#materialsNeeded').value;
    const user = this.state.course.user;
    this.setState({
      course: {
        title,
        description,
        estimatedTime,
        materialsNeeded,
        user,
      },
    });
  };

  /**
   * Handles form submission for the UpdateForm.
   * If user is not authenticated, pushes them to the sign in page.
   * @param {event} e
   * @param {string} token - The JWT token, used for authentication to the API.
   */
  handleSubmit = (e, token) => {
    e.preventDefault();
    if (!token || token === undefined) {
      this.props.history.push('/signin');
    } else {
      const course = this.state.course;
      const data = {
        id: course._id,
        title: course.title,
        description: course.description,
        estimatedTime: course.estimatedTime,
        materialsNeeded: course.materialsNeeded,
      };
      const options = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      axios
        .put(this.dbURI, data, options)
        .then(res => {
          if (res.status === 204) {
            this.props.history.push(`/courses/${this.state.id}`);
          }
        })
        .catch(error => {
          if (error.response.status === 400) {
            this.setState({ errors: error.response.data.errors });
          } else if (error.response.status === 404) {
            this.props.history.push('/notfound');
          } else if ([401, 403].includes(error.response.status)) {
            this.props.history.push('/forbidden');
          } else {
            this.props.history.push('/error');
          }
        });
    }
  };

  // Returns the user to the course details page.
  handleCancel = e => {
    e.preventDefault();
    this.props.history.push(`/courses/${this.props.match.params.id}`);
  };

  render() {
    const { isLoading, course, errors } = this.state;

    return (
      <div className="bounds course--detail">
        <h1>Update Course</h1>
        <div>
          {isLoading ? (
            <Loading />
          ) : (
            <Fragment>
              {errors.length ? <ValidationErrors errors={errors} /> : null}
              <UpdateForm
                course={course}
                handleChange={this.handleChange}
                handleSubmit={this.handleSubmit}
                handleCancel={this.handleCancel}
              />
            </Fragment>
          )}
        </div>
      </div>
    );
  }
}

UpdateCourse.contextType = AuthContext;

export default UpdateCourse;
