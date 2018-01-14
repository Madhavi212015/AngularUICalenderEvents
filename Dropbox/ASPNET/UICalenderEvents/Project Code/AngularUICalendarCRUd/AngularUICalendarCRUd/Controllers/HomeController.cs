using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using AngularUICalendarCRUd.Models;

namespace AngularUICalendarCRUd.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
        //Get Events data from server
        public JsonResult GetEvents(int? personid)
        {
            
            //Here MyDatabaseEntities is our entity datacontext (see Step 4)  
            using (SQLCalenderEntities dc = new SQLCalenderEntities())
            {
                try
                {
                    if (personid > 0)
                    {
                        var v = dc.EventCalenders.Where(c => c.PersonId == personid).ToList();

                        var newList = v.Select(l => new
                        {
                            l.EventID,
                            l.Title,
                            l.Description,
                            l.StartAt,
                            l.EndAt,
                            l.IsFullDay
                        }).ToList();
                        return new JsonResult { Data = newList, JsonRequestBehavior = JsonRequestBehavior.AllowGet };
                    }
                    else
                        return new JsonResult { Data = null };
                }
                catch (Exception ex)
                {
                    Console.Write(ex.Message.ToString());

                    return new JsonResult { };
                }

            }
        }

        public JsonResult GetPersonList()
        {
            using (SQLCalenderEntities dc = new SQLCalenderEntities())
            {
                try
                {
                    var v = dc.People.ToList();
                    var newList = v.Select(l => new
                    {
                        l.Id,
                        l.Name,
                        l.Email
                    }).ToList();
                    return new JsonResult { Data = newList, JsonRequestBehavior = JsonRequestBehavior.AllowGet };
                }
                catch (Exception ex)
                {
                    Console.Write(ex.Message.ToString());

                    return new JsonResult { };
                }

            }
        }


        //Action for Save event  
        [HttpPost]
        public JsonResult SaveEvent(EventCalender evt, int personid)
        {
            //bool status = false;
            using (SQLCalenderEntities dc = new SQLCalenderEntities())
            {
                if (evt.EndAt != null && evt.StartAt.TimeOfDay == new TimeSpan(0, 0, 0))
                {
                    evt.IsFullDay = true;
                }
                else
                {
                    evt.IsFullDay = false;
                }

                if (evt.EventID > 0)
                {
                    var v = dc.EventCalenders.Where(a => a.EventID.Equals(evt.EventID)).FirstOrDefault();
                    if (v != null)
                    {
                        v.Title = evt.Title;
                        v.Description = evt.Description;
                        v.StartAt = evt.StartAt;
                        v.EndAt = evt.EndAt;
                        v.IsFullDay = evt.IsFullDay;
                        v.PersonId = evt.PersonId;
                    }
                }
                else
                {
                    evt.PersonId = personid;
                    dc.EventCalenders.Add(evt);
                }
                dc.SaveChanges();
                var p = dc.EventCalenders.Where(c => c.PersonId == personid).ToList();
                var newList = p.Select(l => new
                {
                    l.EventID,
                    l.Title,
                    l.Description,
                    l.StartAt,
                    l.EndAt,
                    l.IsFullDay
                }).ToList();
                return new JsonResult { Data = newList };
            }

        }

        [HttpPost]
        public JsonResult DeleteEvent(int eventID, int personid)
        {
          //  bool status = false;
            using (SQLCalenderEntities dc = new SQLCalenderEntities())
            {
                var v = dc.EventCalenders.Where(a => a.EventID.Equals(eventID)).FirstOrDefault();
                if (v != null)
                {
                    dc.EventCalenders.Remove(v);
                    dc.SaveChanges();
                   // status = true;
                }
                var p = dc.EventCalenders.Where(c => c.PersonId == personid).ToList();
                var newList = p.Select(l => new
                {
                    l.EventID,
                    l.Title,
                    l.Description,
                    l.StartAt,
                    l.EndAt,
                    l.IsFullDay
                }).ToList();
                return new JsonResult { Data = newList };
            }
                       
        }
    }

}


